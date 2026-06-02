import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  Info,
  Maximize2,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { useAppContext } from "@Context/App.context";
import httpServiceObj from "@Services/ApiHandler.service";
import {
  gcal_1,
  gcal_2,
  gcal_3,
  gcal_4,
  gcal_5,
  gcal_6,
  ocal_1,
  ocal_2,
  ocal_3,
} from "@AssetsFolder/assets";

type CalendarProvider = "google" | "microsoft";

interface Props {
  value?: string;
  loading?: boolean;
  onChange?: (value: string) => void;
  onVerify?: (icalUrl: string) => Promise<void> | void;
}

const PROVIDERS: Record<
  CalendarProvider,
  {
    label: string;
    color: string;
    image: string;
    url: string;
    steps: string[];
    adminRestriction: string[];
  }
> = {
  google: {
    label: "Google",
    color: "border-red-200 hover:border-red-400",
    image: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg",
    url: "https://calendar.google.com/calendar/u/0/r/settings/calendar/",
    steps: [
      "Open Google Calendar settings",
      "Select your calendar from left sidebar",
      "Scroll to 'Integrate calendar'",
      "Copy 'Secret address in iCal format'",
      "Paste it below",
    ],
    adminRestriction: [
      "Ask IT/Admin to enable external calendar sharing",
      "Ask admin to allow private iCal publishing",
      "Request access to 'Secret iCal address'",
    ],
  },
  microsoft: {
    label: "Outlook / Microsoft 365",
    color: "border-blue-200 hover:border-blue-400",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/b/b3/Microsoft_Outlook_logo_%282024%E2%80%932025%29.svg",
    url: "https://outlook.office.com/calendar/options/calendar/sharedcalendars",
    steps: [
      "Open Outlook Calendar settings",
      "Go to Shared Calendars",
      "Choose 'Publish Calendar'",
      "Select permissions (busy only preferred)",
      "Copy ICS/iCal link and paste below",
    ],
    adminRestriction: [
      "Ask Microsoft tenant admin to enable calendar publishing",
      "Request external calendar sharing access",
      "Ask IT to enable ICS publishing for your mailbox",
    ],
  },
};

const PROVIDER_CAROUSELS: Record<CalendarProvider, readonly string[]> = {
  google: [gcal_1, gcal_2, gcal_3, gcal_4, gcal_5, gcal_6],
  microsoft: [ocal_1, ocal_2, ocal_3],
} as const;

const GoogleIntegration: React.FC<Props> = ({}) => {
  const { userDetails } = useAppContext();
  const [selected, setSelected] = useState<CalendarProvider>("google");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [icalUrl, setIcalUrl] = useState("");
  const [hasStoredUrl, setHasStoredUrl] = useState(false);
  const [isUrlEditorOpen, setIsUrlEditorOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const provider = useMemo(() => PROVIDERS[selected], [selected]);
  const carouselImages = useMemo(() => PROVIDER_CAROUSELS[selected], [selected]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [selected]);

  useEffect(() => {
    let cancelled = false;

    const loadStoredUrl = async () => {
      if (!userDetails?.id) return;
      const { error } = await httpServiceObj.get(`/user/freebusy/${userDetails.id}`, true, {
        email: userDetails.email,
      });
      if (cancelled) return;
      const storedUrlExists = !error;
      setHasStoredUrl(storedUrlExists);
      setIsUrlEditorOpen(!storedUrlExists);
    };

    void loadStoredUrl();
    return () => {
      cancelled = true;
    };
  }, [userDetails?.id]);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreenOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleVerify = async () => {
    try {
      const trimmedUrl = icalUrl.trim();
      if (!trimmedUrl) {
        toast.error("Please paste a private iCal / ICS URL first.", getToastOptions());
        return;
      }
      setSaving(true);
      const payload = { email: userDetails?.email, icalUrl: trimmedUrl };
      const request = hasStoredUrl
        ? httpServiceObj.patch(`/user/freebusy`, payload)
        : httpServiceObj.post("/user/freebusy", payload);
      const { error } = await request;
      if (error) {
        toast.error(
          hasStoredUrl
            ? "Failed to update calendar URL. Please check the URL and try again."
            : "Failed to verify calendar. Please check the URL and try again.",
          getToastOptions()
        );
        return;
      }
      setHasStoredUrl(true);
      setIcalUrl(trimmedUrl);
      setIsUrlEditorOpen(false);
      toast.success(
        hasStoredUrl ? "Calendar URL updated successfully!" : "Calendar verified successfully!",
        getToastOptions()
      );
    } catch {
      toast.error(
        "An error occurred while verifying the calendar. Please try again later.",
        getToastOptions()
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopyInstruction = async () => {
    const text = `
${provider.label}

Steps:
${provider.steps.map((x, i) => `${i + 1}. ${x}`).join("\n")}

Admin restrictions:
${provider.adminRestriction.join("\n")}
`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrevImage = () => {
    setCarouselIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCarouselIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full z-[81] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {hasStoredUrl ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <Calendar className="h-5 w-5 text-indigo-600" />
          )}
          <h2 className="text-lg font-semibold text-gray-900">
            {hasStoredUrl ? "Update Calendar" : "Connect Calendar Availability"}
          </h2>
        </div>
        <p className="mt-1 text-sm text-left text-gray-500">
          Share your private iCal/ICS calendar link so we can detect busy time and avoid scheduling
          conflicts.
        </p>
      </div>

      {/* Calendar Provider Buttons */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROVIDERS) as CalendarProvider[]).map((key) => {
          const item = PROVIDERS[key];
          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setSelected(key)}
              onClick={() => window.open(item.url, "_blank")}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-all duration-200 hover:scale-105 p-2 ${
                item.color
              } ${selected === key ? "ring-2 ring-indigo-500" : ""}`}>
              <img src={item.image} alt={item.label} className="h-10 w-10 object-contain" />
            </button>
          );
        })}
      </div>

      {/* Instruction Panel */}
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-left text-gray-900">{provider.label}</h3>
            <button
              onClick={() => window.open(provider.url, "_blank")}
              className="mt-1 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800">
              Open settings
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleCopyInstruction}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            {copied ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy Guide
          </button>
        </div>

        {/* Steps + Image — equal height columns */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* Steps */}
          <div className="flex flex-col">
            <h4 className="mb-3 text-sm text-left font-semibold text-gray-900">
              Steps to get private iCal link
            </h4>
            <div className="flex flex-col flex-1 gap-2">
              {provider.steps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-lg bg-white p-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image Carousel */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-white/60 bg-white p-3 shadow-sm flex flex-col flex-1">
              {/* Image area with chevrons */}
              <div
                className="relative flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"
                style={{ minHeight: "220px" }}>
                <img
                  src={carouselImages[carouselIndex]}
                  alt={`${provider.label} step ${carouselIndex + 1}`}
                  className="h-full w-full object-contain transition-transform duration-300"
                  style={{ maxHeight: "300px" }}
                />

                {/* Left chevron */}
                {carouselImages.length > 1 && (
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={handlePrevImage}
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-white transition-all duration-150 hover:scale-110 z-10">
                    <ChevronLeft className="h-4 w-4 text-gray-700" />
                  </button>
                )}

                {/* Right chevron */}
                {carouselImages.length > 1 && (
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-white transition-all duration-150 hover:scale-110 z-10">
                    <ChevronRight className="h-4 w-4 text-gray-700" />
                  </button>
                )}

                {/* Maximize / Fullscreen button */}
                <button
                  type="button"
                  aria-label="View fullscreen"
                  onClick={() => setIsFullscreenOpen(true)}
                  className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-white shadow-md border border-gray-200 hover:bg-white transition-all duration-150 hover:scale-110 z-10">
                  <Maximize2 className="h-3.5 w-3.5 text-gray-700" />
                </button>
              </div>

              {/* Dot indicators */}
              {carouselImages.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {carouselImages.map((_, index) => (
                    <button
                      key={`${selected}-carousel-dot-${index}`}
                      type="button"
                      aria-label={`Show ${provider.label} step ${index + 1}`}
                      onClick={() => setCarouselIndex(index)}
                      className={`h-2.5 rounded-full transition-all duration-200 ${
                        carouselIndex === index
                          ? "w-7 bg-indigo-600"
                          : "w-2.5 bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}

              <p className="mt-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                {carouselIndex + 1} / {carouselImages.length}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Restriction */}
        <div className="rounded-xl border mt-4 text-left border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-gray-900">Company Admin Restrictions</h4>
          </div>
          <p className="mb-3 text-sm text-gray-700 font-semibold">
            <Info className="inline-block h-5 pb-1" />
            Note: If this option is missing or disabled, your organization may block calendar
            publishing.
          </p>
          <p className="mb-2 text-sm font-medium text-gray-900">Ask your IT/Admin:</p>
          <div className="space-y-2">
            {provider.adminRestriction.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-gray-700">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="mt-5">
        {hasStoredUrl && !isUrlEditorOpen ? (
          <>
            <h5 className="text-left font-bold text-blue-600 mb-2">Already Added ICS URL
              <CheckCircle2 className="inline-block p-1 ml-2 mb-1"/>
            </h5>
            <button
              type="button"
              onClick={() => setIsUrlEditorOpen(true)}
              className="flex w-fit gap-2 items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100">
              <span>Update Current ICS URL</span>
              <Edit className="h-4 w-4 shrink-0" />
            </button>
          </>
        ) : (
          <>
            <label className="mb-2 block text-sm font-medium text-gray-900">
              Paste Private iCal / ICS URL
            </label>
            <input
              type="text"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://calendar.google.com/calendar/ical/..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <p className="mt-2 text-xs text-gray-500">
              We only use this to read busy/free availability. Event details are ignored.
            </p>

            {/* Verify Button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={saving || !icalUrl.trim()}
                onClick={handleVerify}
                className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
                  saving || !icalUrl.trim()
                    ? "cursor-not-allowed bg-gray-300"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}>
                {saving
                  ? hasStoredUrl
                    ? "Updating..."
                    : "Verifying..."
                  : hasStoredUrl
                  ? "Update Calendar Link"
                  : "Verify Calendar"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
          style={{ zIndex: 90 }}
          onClick={() => setIsFullscreenOpen(false)}>
          <div
            className="relative max-h-[90vh] max-w-[90vw] rounded-2xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              type="button"
              aria-label="Close fullscreen"
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-white transition-all">
              <X className="h-4 w-4 text-red-500 font-bold" />
            </button>

            {/* Image — same carouselIndex as the main carousel */}
            <img
              src={carouselImages[carouselIndex]}
              alt="Fullscreen preview"
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />

            {/* Left chevron */}
            {carouselImages.length > 1 && (
              <button
                type="button"
                aria-label="Previous image"
                onClick={handlePrevImage}
                className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-white transition-all duration-150 hover:scale-110 z-10">
                <ChevronLeft className="h-4 w-4 text-gray-700" />
              </button>
            )}

            {/* Right chevron */}
            {carouselImages.length > 1 && (
              <button
                type="button"
                aria-label="Next image"
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 hover:bg-white transition-all duration-150 hover:scale-110 z-10">
                <ChevronRight className="h-4 w-4 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleIntegration;
