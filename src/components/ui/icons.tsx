import {
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from "react";
import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowsDownUp as PhArrowsDownUp,
  ArrowsOut as PhArrowsOut,
  ArrowClockwise as PhArrowClockwise,
  ArrowCounterClockwise as PhArrowCounterClockwise,
  ArrowDown as PhArrowDown,
  ArrowLeft as PhArrowLeft,
  ArrowRight as PhArrowRight,
  ArrowUp as PhArrowUp,
  ArrowUpRight as PhArrowUpRight,
  Barbell as PhBarbell,
  Bathtub as PhBathtub,
  Bed as PhBed,
  Bell as PhBell,
  BellSimpleRinging as PhBellSimpleRinging,
  Bookmark as PhBookmark,
  Building as PhBuilding,
  BuildingApartment as PhBuildingApartment,
  Calendar as PhCalendar,
  CalendarBlank as PhCalendarBlank,
  Camera as PhCamera,
  Car as PhCar,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  Cat as PhCat,
  Cigarette as PhCigarette,
  ChatCenteredDots as PhChatCenteredDots,
  ChatCircleText as PhChatCircleText,
  ChatText as PhChatText,
  Check as PhCheck,
  CheckCircle as PhCheckCircle,
  Circle as PhCircle,
  Clipboard as PhClipboard,
  ClipboardText as PhClipboardText,
  Clock as PhClock,
  Compass as PhCompass,
  CopySimple as PhCopySimple,
  CreditCard as PhCreditCard,
  DeviceMobile as PhDeviceMobile,
  Dog as PhDog,
  DotsThreeOutline as PhDotsThreeOutline,
  Drop as PhDrop,
  EnvelopeSimple as PhEnvelopeSimple,
  Eye as PhEye,
  EyeSlash as PhEyeSlash,
  Fan as PhFan,
  File as PhFile,
  FileText as PhFileText,
  Flame as PhFlame,
  FloppyDisk as PhFloppyDisk,
  Folder as PhFolder,
  GridNine as PhGridNine,
  Heart as PhHeart,
  House as PhHouse,
  ImagesSquare as PhImagesSquare,
  Info as PhInfo,
  Lifebuoy as PhLifebuoy,
  Lightning as PhLightning,
  List as PhList,
  Lock as PhLock,
  MagnifyingGlass as PhMagnifyingGlass,
  MapTrifold as PhMapTrifold,
  MapPin as PhMapPin,
  Megaphone as PhMegaphone,
  Minus as PhMinus,
  NotePencil as PhNotePencil,
  PaperPlaneTilt as PhPaperPlaneTilt,
  PawPrint as PhPawPrint,
  PencilSimpleLine as PhPencilSimpleLine,
  Phone as PhPhone,
  Play as PhPlay,
  PlayCircle as PhPlayCircle,
  Plus as PhPlus,
  PlusSquare as PhPlusSquare,
  Prohibit as PhProhibit,
  Rabbit as PhRabbit,
  Ruler as PhRuler,
  SealCheck as PhSealCheck,
  Share as PhShare,
  Shield as PhShield,
  ShieldCheck as PhShieldCheck,
  SignOut as PhSignOut,
  SlidersHorizontal as PhSlidersHorizontal,
  Snowflake as PhSnowflake,
  Sparkle as PhSparkle,
  SpeakerHigh as PhSpeakerHigh,
  SpeakerSlash as PhSpeakerSlash,
  SpinnerGap as PhSpinnerGap,
  SquaresFour as PhSquaresFour,
  Square as PhSquare,
  StackSimple as PhStackSimple,
  Sun as PhSun,
  Television as PhTelevision,
  Tent as PhTent,
  TextT as PhTextT,
  ToggleLeft as PhToggleLeft,
  ToggleRight as PhToggleRight,
  Trash as PhTrash,
  Tree as PhTree,
  TrendDown as PhTrendDown,
  TrendUp as PhTrendUp,
  Upload as PhUpload,
  User as PhUser,
  UserCircle as PhUserCircle,
  UserCircleGear as PhUserCircleGear,
  UserPlus as PhUserPlus,
  Users as PhUsers,
  VideoCamera as PhVideoCamera,
  Wallet as PhWallet,
  Wall as PhWall,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  WarningOctagon as PhWarningOctagon,
  Waves as PhWaves,
  WifiHigh as PhWifiHigh,
  WifiSlash as PhWifiSlash,
  Wind as PhWind,
  Wrench as PhWrench,
  X as PhX,
  XCircle as PhXCircle,
} from "@phosphor-icons/react/ssr";

export type LucideProps = Omit<IconProps, "weight"> & {
  absoluteStrokeWidth?: boolean;
  strokeWidth?: number | string;
  weight?: IconWeight;
};

export type LucideIcon = ForwardRefExoticComponent<
  LucideProps & RefAttributes<SVGSVGElement>
>;

const FILL_CLASS_PATTERN = /\bfill-(?!none\b)\S*/;

function resolveWeight({
  className,
  fill,
  strokeWidth,
  weight,
}: Pick<LucideProps, "className" | "fill" | "strokeWidth" | "weight">) {
  if (weight) {
    return weight;
  }

  if (
    (typeof className === "string" && FILL_CLASS_PATTERN.test(className))
    || (typeof fill === "string" && fill !== "none")
  ) {
    return "fill";
  }

  const normalizedStrokeWidth = typeof strokeWidth === "number"
    ? strokeWidth
    : typeof strokeWidth === "string"
      ? Number.parseFloat(strokeWidth)
      : Number.NaN;

  if (!Number.isFinite(normalizedStrokeWidth)) {
    return undefined;
  }

  if (normalizedStrokeWidth <= 0) {
    return "fill";
  }

  if (normalizedStrokeWidth <= 1.55) {
    return "thin";
  }

  if (normalizedStrokeWidth <= 1.95) {
    return "light";
  }

  if (normalizedStrokeWidth <= 2.4) {
    return "regular";
  }

  return "bold";
}

function createIcon(IconComponent: Icon): LucideIcon {
  const WrappedIcon = forwardRef<SVGSVGElement, LucideProps>(
    ({ absoluteStrokeWidth, strokeWidth, weight, ...props }, ref) => {
      void absoluteStrokeWidth;

      return (
        <IconComponent
          ref={ref}
          weight={resolveWeight({
            className: props.className,
            fill: props.fill,
            strokeWidth,
            weight,
          })}
          {...props}
        />
      );
    },
  );

  WrappedIcon.displayName = `AppleIcon(${IconComponent.displayName ?? IconComponent.name ?? "Icon"})`;

  return WrappedIcon;
}

export const AirVent = createIcon(PhFan);
export const AlertCircle = createIcon(PhWarningCircle);
export const AlertTriangle = createIcon(PhWarning);
export const ArrowDown = createIcon(PhArrowDown);
export const ArrowLeft = createIcon(PhArrowLeft);
export const ArrowRight = createIcon(PhArrowRight);
export const ArrowUp = createIcon(PhArrowUp);
export const ArrowUpDown = createIcon(PhArrowsDownUp);
export const ArrowUpRight = createIcon(PhArrowUpRight);
export const BadgeCheck = createIcon(PhSealCheck);
export const Ban = createIcon(PhProhibit);
export const Bath = createIcon(PhBathtub);
export const Bed = createIcon(PhBed);
export const BedDouble = createIcon(PhBed);
export const Bell = createIcon(PhBell);
export const BellDot = createIcon(PhBellSimpleRinging);
export const Blocks = createIcon(PhSquaresFour);
export const Bookmark = createIcon(PhBookmark);
export const Building = createIcon(PhBuilding);
export const Building2 = createIcon(PhBuildingApartment);
export const Calendar = createIcon(PhCalendar);
export const CalendarRange = createIcon(PhCalendarBlank);
export const Camera = createIcon(PhCamera);
export const Car = createIcon(PhCar);
export const Cat = createIcon(PhCat);
export const Check = createIcon(PhCheck);
export const CheckCircle = createIcon(PhCheckCircle);
export const CheckCircle2 = createIcon(PhCheckCircle);
export const CheckIcon = Check;
export const ChevronDown = createIcon(PhCaretDown);
export const ChevronDownIcon = ChevronDown;
export const ChevronLeft = createIcon(PhCaretLeft);
export const ChevronRight = createIcon(PhCaretRight);
export const ChevronRightIcon = ChevronRight;
export const ChevronUp = createIcon(PhCaretUp);
export const ChevronUpIcon = ChevronUp;
export const Cigarette = createIcon(PhCigarette);
export const CircleAlert = createIcon(PhWarningCircle);
export const CircleCheckIcon = CheckCircle2;
export const CircleIcon = createIcon(PhCircle);
export const CircleParking = createIcon(PhCar);
export const Clapperboard = createIcon(PhVideoCamera);
export const ClipboardCheck = createIcon(PhClipboard);
export const ClipboardList = createIcon(PhClipboardText);
export const Clock = createIcon(PhClock);
export const Clock3 = createIcon(PhClock);
export const Compass = createIcon(PhCompass);
export const CopyPlus = createIcon(PhCopySimple);
export const CreditCard = createIcon(PhCreditCard);
export const Dog = createIcon(PhDog);
export const Droplets = createIcon(PhDrop);
export const Dumbbell = createIcon(PhBarbell);
export const Edit = createIcon(PhNotePencil);
export const Eye = createIcon(PhEye);
export const EyeOff = createIcon(PhEyeSlash);
export const Fence = createIcon(PhWall);
export const FileCheck = createIcon(PhFile);
export const FileStack = createIcon(PhStackSimple);
export const FileText = createIcon(PhFileText);
export const Flame = createIcon(PhFlame);
export const FolderArchive = createIcon(PhFolder);
export const Grid3X3 = createIcon(PhGridNine);
export const Heart = createIcon(PhHeart);
export const Home = createIcon(PhHouse);
export const ImagePlus = createIcon(PhImagesSquare);
export const Info = createIcon(PhInfo);
export const InfoIcon = Info;
export const Layers3 = createIcon(PhStackSimple);
export const LayoutDashboard = createIcon(PhSquaresFour);
export const LifeBuoy = createIcon(PhLifebuoy);
export const List = createIcon(PhList);
export const Loader2 = createIcon(PhSpinnerGap);
export const Loader2Icon = Loader2;
export const Lock = createIcon(PhLock);
export const LogOut = createIcon(PhSignOut);
export const Mail = createIcon(PhEnvelopeSimple);
export const Map = createIcon(PhMapTrifold);
export const MapPin = createIcon(PhMapPin);
export const Maximize = createIcon(PhArrowsOut);
export const Megaphone = createIcon(PhMegaphone);
export const Menu = List;
export const MessageCircle = createIcon(PhChatCircleText);
export const MessageSquare = createIcon(PhChatText);
export const MessageSquareMore = createIcon(PhChatCenteredDots);
export const Minus = createIcon(PhMinus);
export const MoreHorizontal = createIcon(PhDotsThreeOutline);
export const OctagonXIcon = createIcon(PhWarningOctagon);
export const ParkingCircle = createIcon(PhCar);
export const PawPrint = createIcon(PhPawPrint);
export const PenTool = createIcon(PhPencilSimpleLine);
export const Phone = createIcon(PhPhone);
export const Play = createIcon(PhPlay);
export const PlayCircle = createIcon(PhPlayCircle);
export const Plus = createIcon(PhPlus);
export const PlusSquare = createIcon(PhPlusSquare);
export const Rabbit = createIcon(PhRabbit);
export const RefreshCcw = createIcon(PhArrowCounterClockwise);
export const RefreshCw = createIcon(PhArrowClockwise);
export const Refrigerator = createIcon(PhSnowflake);
export const RotateCcw = createIcon(PhArrowCounterClockwise);
export const Ruler = createIcon(PhRuler);
export const Save = createIcon(PhFloppyDisk);
export const Search = createIcon(PhMagnifyingGlass);
export const Send = createIcon(PhPaperPlaneTilt);
export const Share2 = createIcon(PhShare);
export const Shield = createIcon(PhShield);
export const ShieldCheck = createIcon(PhShieldCheck);
export const SlidersHorizontal = createIcon(PhSlidersHorizontal);
export const Smartphone = createIcon(PhDeviceMobile);
export const Sparkles = createIcon(PhSparkle);
export const Square = createIcon(PhSquare);
export const SquarePen = createIcon(PhNotePencil);
export const Sun = createIcon(PhSun);
export const Tent = createIcon(PhTent);
export const ToggleLeft = createIcon(PhToggleLeft);
export const ToggleRight = createIcon(PhToggleRight);
export const Trash2 = createIcon(PhTrash);
export const Trees = createIcon(PhTree);
export const TrendingDown = createIcon(PhTrendDown);
export const TrendingUp = createIcon(PhTrendUp);
export const TriangleAlertIcon = createIcon(PhWarning);
export const Tv = createIcon(PhTelevision);
export const Type = createIcon(PhTextT);
export const Upload = createIcon(PhUpload);
export const User = createIcon(PhUser);
export const UserPlus = createIcon(PhUserPlus);
export const UserRound = createIcon(PhUserCircle);
export const UserRoundCog = createIcon(PhUserCircleGear);
export const Users = createIcon(PhUsers);
export const Volume2 = createIcon(PhSpeakerHigh);
export const VolumeOff = createIcon(PhSpeakerSlash);
export const Wallet = createIcon(PhWallet);
export const Wallet2 = Wallet;
export const Waves = createIcon(PhWaves);
export const Wifi = createIcon(PhWifiHigh);
export const WifiOff = createIcon(PhWifiSlash);
export const Wind = createIcon(PhWind);
export const Wrench = createIcon(PhWrench);
export const X = createIcon(PhX);
export const XCircle = createIcon(PhXCircle);
export const XIcon = X;
export const Zap = createIcon(PhLightning);
