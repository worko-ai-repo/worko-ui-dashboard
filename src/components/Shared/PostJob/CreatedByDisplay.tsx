import { JobData } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import React, { useEffect, useState } from "react";

interface UserData {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  // Add other user properties as needed
}

export interface CreatedByDisplayProps<
  T extends object = {
    createdByUserId?: string;
    createdByCorporateUserId?: string;
    updatedByUserId?: string;
    updatedByCorporateUserId?: string;
  }
> {
  row: T;
  mode?: "created" | "updated";
}

const CreatedByDisplay = <
  T extends {
    createdByUserId?: string;
    createdByCorporateUserId?: string;
    updatedByUserId?: string;
    updatedByCorporateUserId?: string;
  }
>({
  row,
  mode = "created",
}: CreatedByDisplayProps<T>) => {
  const [userData, setUserData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      let userId = "";
      let corporateUserId = "";

      if (mode === "created") {
        userId = row?.createdByUserId || "";
        corporateUserId = row?.createdByCorporateUserId || "";
      } else if (mode === "updated") {
        userId = row?.updatedByUserId || "";
        corporateUserId = row?.updatedByCorporateUserId || "";
      }

      if (!corporateUserId && !userId) {
        throw new Error("No user ID found for display");
      }

      setLoading(true);
      try {
        let url = "";

        if (corporateUserId) {
          url = `/corporate-user/${corporateUserId}`;
        } else if (userId) {
          // user/:createdByUserId/detail`
          url = `/user/${userId}/detail`;
        }

        const { response, error } = await httpServiceObj.get<UserData[]>(
          url,
          true,
          {},
          false,
          "BASE"
        );
        if (!response?.length || error) {
          throw new Error("Failed to fetch user data");
        }

        //Construct display name
        const displayName = response?.[0].firstName
          ? `${response?.[0].firstName} ${response?.[0].lastName || ""}`.trim()
          : response?.[0].name || response?.[0].id;
        setUserData(displayName);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [
    row?.createdByCorporateUserId,
    row?.createdByUserId,
    row?.updatedByCorporateUserId,
    row?.updatedByUserId,
    mode,
  ]);

  if (loading) return <div>Loading...</div>;
  if (!userData) return <div>No user data</div>;

  return <div>{userData}</div>;
};

export default CreatedByDisplay;
