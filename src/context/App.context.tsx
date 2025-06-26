import { JwtPayload } from 'jwt-decode';
import {fetchAuthSession} from '@aws-amplify/auth'
import CognitoServiceObj from '@Utils/Cognito.utils';
import secureStorage from '@Utils/SecureStorage.utils';
import httpServiceObj from '@Services/ApiHandler.service';
import { SecureStorageKeyEnum } from '@Enums/SecureStorage.enum';
import { AuthLoginForGeneralUserDto } from '@Interfaces/Auth.dto';
import { AppContextType, ContextProviderProps } from '@Interfaces/ContextProvider.dto';
import { createContext, useState, useContext, useCallback, useLayoutEffect, useMemo } from 'react';

// Corporate User Interface
export interface CorporateUserDetail extends AuthLoginForGeneralUserDto {
	id: string;
	companyId: string;
	firstName: string;
	lastName: string;
	email: string;
	createdAt: string;
	updatedAt: string;
	isDeleted: boolean;
	cognitoUserId: string;
	corporateUserType: string;
	PK: string;
	SK: string;
	GSI1PK: string;
	GSI1SK: string;
}

export interface CorporateUserDetailOnly{
	id: string;
	companyId: string;
	firstName: string;
	lastName: string;
	email: string;
	createdAt: string;
	updatedAt: string;
	isDeleted: boolean;
	cognitoUserId: string;
	corporateUserType: string;
	PK: string;
	SK: string;
	GSI1PK: string;
	GSI1SK: string;
}

export interface CognitoMetaDataDto extends JwtPayload {
	'cognito:groups'?: string[];
	email_verified?: boolean;
	phone_number_verified?: boolean;
	'cognito:username'?: string;
	origin_jti?: string;
	event_id?: string;
	token_use?: string;
	auth_time?: number;
	name?: string;
	phone_number?: string;
	email?: string;
}

// Create the context object
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the provider component
export const AppProvider = ({ children }: ContextProviderProps) => {
	// State variables
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [tokenData, setTokenData] = useState<any | null>(null);
	const [userDetails, setUserDetails] = useState<Partial<CorporateUserDetail>>({});
	const [updateCheck, setUpdateCheck] = useState<boolean>(false);
	const [PendingApply, setPendingApply] = useState<any | null>(null);
	const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
	const [isLoadingUserDetails, setIsLoadingUserDetails] = useState<boolean>(false);

	console.info('Initializing AppProvider...');
	// Fetch user details based on user type
	const fetchUserDetails = async (userType: string[] | undefined, userId: string | undefined, userEmail: string | undefined) => {
		try {
			setIsLoadingUserDetails(true);
			let userResponse;
			
			if (userType?.includes('corporate-admin') || userType?.includes('corporate-recruiter')) {
				const { response, error } = await httpServiceObj.get<[CorporateUserDetail]>(`/corporate-user/${userId}/cognito`, true, {});
				if (error) {
					throw new Error(error.message);
				}
				userResponse = response?.[0] || {};
			} else {
				const { response, error } = await httpServiceObj.get<[Partial<CorporateUserDetail>]>(`/user/${userEmail}/details`, true, {});
				if (error) {
					throw new Error(error.message);
				}
				userResponse = response?.[0] || {};
			}

			const userDetails: Partial<CorporateUserDetail> = userResponse;
			setUserDetails(userDetails);
			secureStorage.setItem<Partial<CorporateUserDetail>>(SecureStorageKeyEnum.LOGINDETAILS, userDetails);
			secureStorage.setItem<Partial<CorporateUserDetail>>(SecureStorageKeyEnum.CORPORATECOMPANYID, { companyId: userDetails?.companyId || '' });
		} catch (error) {
			console.error('Error fetching user details:', error);
			// If we can't fetch user details but user is logged in, sign them out
			await CognitoServiceObj.handleSignOut();
			setIsLoggedIn(false);
			setUserDetails({});
		} finally {
			setIsLoadingUserDetails(false);
		}
	};

	// Check if user is logged in
// Check if user is logged in
useLayoutEffect(() => {
	const checkUserLoggedIn = async () => {
		try {
			console.info('Checking user authentication status...');
			const isUserLoggedIn = await CognitoServiceObj.isLoggedIn();
			
			if (!isUserLoggedIn) {
				setIsLoggedIn(false);
				setUserDetails({});
				setTokenData(null);
				return;
			}

			// ✅ DO NOT set isLoggedIn = true here yet!
			// User is logged in, now ensure we have user details
			const { tokens } = await fetchAuthSession();
			const cognitoUserDetails: CognitoMetaDataDto | undefined = tokens?.idToken?.payload;
			const userType: string[] | undefined = cognitoUserDetails?.['cognito:groups'];
			const userEmail = cognitoUserDetails?.email;
			const userId = cognitoUserDetails?.sub;

			// Get token and store it
			const token = CognitoServiceObj.getAccessToken();
			setTokenData(token);

			// Check if user details are already stored and valid
			const storedUserDetails = secureStorage.getItem(SecureStorageKeyEnum.LOGINDETAILS);
			
			if (storedUserDetails && Object.keys(storedUserDetails).length > 0) {
				setUserDetails(storedUserDetails);
			} else {
				// No user details found, fetch them
				await fetchUserDetails(userType, userId, userEmail);
			}

			// ✅ NOW set isLoggedIn = true AFTER we have userDetails
			setIsLoggedIn(true);

		} catch (error) {
			console.error('Authentication check failed:', error);
			await CognitoServiceObj.handleSignOut();
			setIsLoggedIn(false);
			setUserDetails({});
			setTokenData(null);
		}
	};

	checkUserLoggedIn();

	// Refresh user login status every 50 minutes
	const interval = setInterval(checkUserLoggedIn, 50 * 60 * 1000);
	return () => clearInterval(interval);
}, [updateCheck]);

	// Function to set authentication state
	const setAuthState = useCallback((data: any, loggedIn: boolean) => {
		setTokenData(data);
		setIsLoggedIn(loggedIn);
		if (!loggedIn) {
			setUserDetails({});
		}
	}, []);

	// Memoized context value
	const memoizedValue = useMemo(
		() => ({
			isLoggedIn,
			tokenData,
			setAuthState,
			setUpdateCheck,
			userDetails,
			PendingApply,
			setPendingApply,
			isModalOpen,
			setIsModalOpen,
			isLoadingUserDetails,
		}),
		[isLoggedIn, tokenData, setAuthState, userDetails, setUpdateCheck, PendingApply, setPendingApply, isModalOpen, setIsModalOpen, isLoadingUserDetails]
	);

	return <AppContext.Provider value={memoizedValue}>{children}</AppContext.Provider>;
};

/**
 * useAppContext Hook
 *
 * This hook is used to access the context object
 */
export const useAppContext = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useAppContext must be used within an AppProvider');
	}
	return context;
};