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

const CreatedByDisplay = ({ row, mode = "created" }: { row: JobData; mode: "created" | "updated" }) => {
    const [userData, setUserData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            let userId = "";
            let corporateUserId = "";

            if (mode === "created") {
                userId = row?.createdByUserId;
                corporateUserId = row?.createdByCorporateUserId;
            } else if (mode === "updated") {
                userId = row?.updatedByUserId || "";
                corporateUserId = row?.updatedByCorporateUserId || "";
            }

            if (!corporateUserId && !userId) return;

            setLoading(true);
            try {
                let url = "";

                if (corporateUserId) {
                    url = `/corporate-user/${corporateUserId}`;
                } else if (userId) {
                    url = `/user/${userId}`;
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
    }, [row?.createdByCorporateUserId, row?.createdByUserId, row?.updatedByCorporateUserId, row?.updatedByUserId, mode]);

    if (loading) return <div>Loading...</div>;
    if (!userData) return <div>No user data</div>;

    return <div>{userData}</div>;
};

export default CreatedByDisplay;
