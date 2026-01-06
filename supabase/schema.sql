-- Users Profile (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'tenant' CHECK (role IN ('tenant', 'landlord', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_docs JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landlord Verification Requests
CREATE TABLE landlord_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Properties
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL, -- apartment, house, room, commercial
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  coordinates JSONB, -- {lat, lng} from Mapbox
  price_nad DECIMAL(10,2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  size_sqm DECIMAL(8,2),
  amenities JSONB, -- Array of amenity IDs
  pet_policy TEXT,
  utilities_included JSONB,
  images JSONB, -- Array of image URLs
  videos JSONB,
  is_available BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Namibia-specific Amenities
CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  category TEXT -- security, outdoor, utilities, etc.
);

-- Saved Properties (Favorites)
CREATE TABLE saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Inquiries/Booking Requests
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  move_in_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (In-app chat)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leases
CREATE TABLE leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2),
  -- Lease document content (clauses, terms, conditions)
  lease_document JSONB, -- {title, clauses: [{id, title, content}], specialConditions, etc.}
  -- Tenant uploaded documents (IDs, payslips, bank statements)
  tenant_documents JSONB, -- [{type, url, uploaded_at}]
  -- E-signature data
  tenant_signature_data TEXT, -- Base64 encoded signature image
  landlord_signature_data TEXT, -- Base64 encoded signature image
  -- Review notes
  landlord_notes TEXT,
  -- Legacy fields (keeping for backward compatibility)
  terms JSONB, -- Full lease terms
  tenant_signature JSONB,
  landlord_signature JSONB,
  -- Status workflow: draft -> sent_to_tenant -> tenant_signed -> approved/rejected
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_tenant', 'tenant_signed', 'approved', 'rejected', 'revision_requested', 'expired', 'terminated')),
  -- Timestamps
  sent_at TIMESTAMPTZ, -- When sent to tenant
  signed_at TIMESTAMPTZ, -- When tenant signed
  approved_at TIMESTAMPTZ, -- When landlord approved
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL, -- rent, deposit, late_fee
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Requests
CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  type TEXT NOT NULL, -- tenant_review, landlord_review, property_review
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlord_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Basic Policies (To be refined)
-- Users can view their own profile
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Properties are viewable by everyone
CREATE POLICY "Properties are viewable by everyone" ON properties FOR SELECT USING (true);

-- Security Deposits (Escrow Service)
-- Platform holds deposits on behalf of both landlords and tenants
CREATE TABLE deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  -- Status: pending (awaiting payment), held (platform holds), released (returned to tenant), 
  -- forfeited (given to landlord), partial_release (released with deductions)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'held', 'released', 'forfeited', 'partial_release')),
  -- Payment confirmation
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'eft')),
  payment_reference TEXT, -- Bank reference / receipt number
  -- Release details
  release_requested_at TIMESTAMPTZ,
  release_requested_by UUID REFERENCES profiles(id),
  release_reason TEXT,
  deduction_amount DECIMAL(10,2) DEFAULT 0,
  deduction_reason TEXT,
  released_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- Deposits RLS Policies
CREATE POLICY "Tenants can view own deposits" ON deposits 
  FOR SELECT USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view their deposits" ON deposits 
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update deposits" ON deposits 
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert deposits" ON deposits 
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

-- Payments RLS Policies
CREATE POLICY "Tenants can view own payments" ON payments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases WHERE leases.id = payments.lease_id AND leases.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can view their payments" ON payments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leases WHERE leases.id = payments.lease_id AND leases.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Landlords can manage payments" ON payments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM leases WHERE leases.id = payments.lease_id AND leases.landlord_id = auth.uid()
    )
  );

-- Leases RLS Policies
CREATE POLICY "Landlords can view their leases" ON leases
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can insert leases" ON leases
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their leases" ON leases
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view their leases" ON leases
  FOR SELECT USING (auth.uid() = tenant_id);

-- Maintenance Requests RLS Policies
CREATE POLICY "Users can view relevant maintenance requests" ON maintenance_requests
  FOR SELECT USING (
    auth.uid() = tenant_id OR 
    EXISTS (SELECT 1 FROM properties WHERE properties.id = maintenance_requests.property_id AND properties.landlord_id = auth.uid())
  );

CREATE POLICY "Tenants can insert maintenance requests" ON maintenance_requests
  FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update maintenance requests" ON maintenance_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = maintenance_requests.property_id AND properties.landlord_id = auth.uid())
  );
