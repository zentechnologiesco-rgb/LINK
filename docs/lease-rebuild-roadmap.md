# Lease Rebuild Roadmap

## Current Audit

### What was broken or confusing
- The old tenant and landlord payments pages existed, but both were intentionally blocked behind "Coming Soon" overlays.
- The landlord detail route was calling the lease detail client with the wrong props, which broke the page contract.
- Tenant lease detail UI expected backend fields that do not exist anymore (`revisionNotes`, landlord banking fields), so parts of the screen were dead.
- The duplicate "Assign Tenant" path drifted away from the main lease builder and was using an old backend contract.
- Lease activation scheduled rent generation through a public mutation that required auth, so automated payment creation could fail after approval.
- Recurring rent generation did not respect the lease's payment rules well enough, and overdue handling did not create late-fee items.
- Property availability and property approval were coupled too aggressively, so simple availability toggles could accidentally send an already-approved property back into review.

### What is stable now
- Lease approval now schedules payments through an internal backend path.
- Payment schedules are generated from the activated lease instead of relying on a broken shared path.
- Overdue rent can now create late-fee entries automatically.
- The landlord and tenant payments pages are functional and connected back to the lease flow.
- The tenant signing screen works against the real lease backend contract again.
- The duplicate quick-assign flow now forwards landlords into the guided lease setup instead of creating a second system.

## Product Goal

Build one lease experience that feels as simple as ordering on Uber Eats:

1. Pick the property.
2. Pick the tenant.
3. Confirm rent, deposit, and rules.
4. Review a clean summary.
5. Send.
6. Track status, signatures, and payments from one place.

The user should never wonder:
- Which page to use.
- Which step is next.
- Whether the property is still available.
- Whether the tenant is already tied to another active lease.
- Whether rent and fees were generated correctly.

## Target UX

### Landlord flow
1. Start from a property card or lease dashboard.
2. Enter the guided lease builder with the property preselected.
3. Search tenant by email with immediate validation.
4. Set rent rules in plain language:
   - Rent amount
   - Deposit
   - Due day
   - Grace period
   - Late fee
   - Notice period
   - Pet, smoking, parking, utilities, occupancy
5. Review a single summary page before sending.
6. After tenant signs, approve, request changes, or reject from one screen.
7. After approval, the system should:
   - Lock the property to that tenant
   - Hide the property from public availability
   - Generate rent and deposit items
   - Expose the payment ledger immediately

### Tenant flow
1. Receive lease.
2. Open one clear lease page.
3. See total move-in cost, key rules, and status timeline.
4. Upload required documents.
5. Sign once.
6. After approval, move naturally into rent tracking and payment history.

## System Rules

### Property + tenant linking
- A property can only have one blocking lease flow at a time.
- A tenant can only have one active approved lease at a time.
- Approved lease means the property is occupied.
- Terminated or expired lease means the property can return to available inventory.

### Payment rules
- Create deposit and rent entries at lease activation.
- Support recurring schedules from lease terms, not ad hoc screens.
- Apply overdue status using the lease grace period.
- Generate late-fee entries automatically when rent crosses the overdue threshold.

## Next Phases

### Phase 1: Simplify the creation flow
- Replace the stepper with a shorter guided flow that collapses low-risk details until needed.
- Add a prefilled path from property cards and lease templates.
- Show "move-in total" and "what happens next" on every final review.

### Phase 2: Strengthen the contract
- Add a dedicated lease lifecycle model:
  - draft
  - sent
  - tenant_submitted
  - active
  - ending_soon
  - expired
  - terminated
- Add explicit payment source metadata:
  - initial rent
  - recurring rent
  - deposit
  - late fee
  - manual adjustment
- Add an audit trail for approval, revision requests, and payment recording.

### Phase 3: Make payments truly tenant-ready
- Add landlord payout instructions or in-app proof of payment support.
- Let tenants upload payment proof or reference numbers.
- Show receipts and monthly ledger states:
  - due
  - processing
  - recorded
  - overdue

### Phase 4: Edge-case coverage
- Early move-in or delayed move-in
- Partial first month / proration
- Lease renewal
- Transfer to another unit
- Mid-lease rent changes
- Termination with outstanding balance
- Deposit deductions and release flow tied to the lease close-out

## Design Principles

- One obvious primary action per screen.
- Never show dead pages or hidden half-built flows.
- Status should always answer: "where am I, what is next, who needs to act?"
- Payment information should be visible from both the lease and the payment ledger.
- Every destructive action needs a clear consequence preview.
