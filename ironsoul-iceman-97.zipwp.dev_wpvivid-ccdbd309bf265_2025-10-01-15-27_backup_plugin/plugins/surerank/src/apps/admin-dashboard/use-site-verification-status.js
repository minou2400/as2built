import { useMemo } from '@wordpress/element';

/**
 * URL normalization utility function
 * @param {string} url - The URL to normalize
 */
export const normalizeUrl = ( url ) => url?.replace( /\/$/, '' ) || '';

// Custom hook to determine site verification status and related information
const useSiteVerificationStatus = (
	selectedSite,
	currentSiteUrl,
	searchConsole
) => {
	return useMemo( () => {
		const currentSiteInList = searchConsole?.sites?.some(
			( site ) =>
				site.siteUrl === currentSiteUrl ||
				site.siteUrl === `${ currentSiteUrl }/` ||
				normalizeUrl( site.siteUrl ) === normalizeUrl( currentSiteUrl )
		);

		const isSelectedSiteVerified = () => {
			if ( ! selectedSite ) {
				return false;
			}
			const site = searchConsole?.sites?.find(
				( s ) => s.siteUrl === selectedSite
			);
			return site?.isVerified === true;
		};

		const currentSiteInListButNotVerified =
			currentSiteInList &&
			normalizeUrl( selectedSite ) === normalizeUrl( currentSiteUrl ) &&
			! isSelectedSiteVerified();

		// Only show connect alert if current site is selected and not verified
		const shouldShowConnectAlert =
			normalizeUrl( selectedSite ) === normalizeUrl( currentSiteUrl ) &&
			! isSelectedSiteVerified();

		return {
			currentSiteInList,
			isSelectedSiteVerified: isSelectedSiteVerified(),
			currentSiteInListButNotVerified,
			shouldShowConnectAlert,
		};
	}, [ selectedSite, currentSiteUrl, searchConsole ] );
};

export default useSiteVerificationStatus;
