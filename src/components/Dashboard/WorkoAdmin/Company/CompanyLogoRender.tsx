import { useState } from "react";
import { Building2 } from "lucide-react";
import { CompanyDto } from "@Interfaces/JobsAndCompany.dto";


const CompanyLogoRender = ( row : CompanyDto) => {
  const [imgError, setImgError] = useState(false);
  const finalLogoUrl = row.logo
    ? `${import.meta.env.APP_WORKO_BASE_URL}/images/${row.logo}`
    : row.logoUrl;
  return finalLogoUrl && !imgError ? (
    <img
      data-tooltip-id="my-tooltip"
      data-tooltip-content={row.name}
      src={finalLogoUrl}
      alt={row.name}
      loading="lazy"
      className="h-10 w-10 cursor-pointer border object-contain rounded-full"
      onError={() => setImgError(true)} // This only affects the current component
    />
  ) : (
    <Building2 className="h-10 w-10 cursor-pointer border p-2 rounded-full text-gray-400" />
  );
};

export default CompanyLogoRender;
