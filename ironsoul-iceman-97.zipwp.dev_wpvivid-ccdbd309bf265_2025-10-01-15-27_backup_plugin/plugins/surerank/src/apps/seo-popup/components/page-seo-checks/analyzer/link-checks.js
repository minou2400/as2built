import { __ } from '@wordpress/i18n';
import { createCheck } from './content-checks';
import apiFetch from '@wordpress/api-fetch';

const cacheBrokenLinksResults = new Map();

/**
 * Get broken links from cache.
 * @param {string[]} links
 * @return {string[]} Array of broken links
 */
const getCacheBrokenLinks = ( links ) => {
	if ( ! links?.length ) {
		return [];
	}

	const result = [];
	for ( const url of links ) {
		const cachedResult = cacheBrokenLinksResults.get( url );
		if ( cachedResult?.broken ) {
			result.push( {
				url,
				...cachedResult,
			} );
		}
	}
	return result;
};

const updateCache = ( links ) => {
	if ( ! links?.length ) {
		return cacheBrokenLinksResults.clear();
	}
	// Remove links from cache if they are not in the links array.
	Array.from( cacheBrokenLinksResults.keys() ).forEach( ( url ) => {
		if ( ! links.includes( url ) ) {
			cacheBrokenLinksResults.delete( url );
		}
	} );
};

/**
 * Get all unique links (href/src) from <a> and <img> tags in the document.
 * @param {Document} document
 * @return {string[]} Array of unique URLs
 */
export const getAllLinks = ( document ) => {
	if ( ! document ) {
		return [];
	}
	const linkElements = Array.from( document.querySelectorAll( 'a[href]' ) );
	const urls = linkElements.map( ( el ) => {
		if ( el.tagName.toLowerCase() === 'a' ) {
			let url = el.getAttribute( 'href' );
			// Append base URL if the URL starts with '/'
			if ( ! url.startsWith( 'http' ) ) {
				const baseUrl = ( url.startsWith( '/' ) ? '' : '/' ) + url;
				url = `${ surerank_globals.site_url }${ baseUrl }`;
			}
			return url;
		}
		return null;
	} );
	return Array.from(
		new Set(
			urls.filter(
				( url ) =>
					url &&
					! url.startsWith( '#' ) &&
					! url.toLowerCase().startsWith( 'javascript:' )
			)
		)
	);
};

/**
 * Check links for broken status via API and save results.
 * @param {Object}   params
 * @param {string[]} params.links
 * @param {number}   params.postId
 * @param {string}   params.userAgent
 * @param {Function} params.onProgress
 * @return {Promise<string[]>} Array of broken links
 */
export const checkLinks = async ( {
	links,
	postId,
	userAgent,
	onProgress,
} ) => {
	// Update cache before checking links.
	updateCache( links );

	if ( ! links.length ) {
		return [];
	}

	const uniqueLinks = links.filter(
		( url ) => ! cacheBrokenLinksResults.has( url )
	);
	const resultFromCache = getCacheBrokenLinks( links );

	if ( uniqueLinks.length === 0 ) {
		return resultFromCache;
	}

	const total = links.length;
	let current = links.length - uniqueLinks.length;

	if ( typeof onProgress === 'function' ) {
		onProgress( 'isCheckingLinks', true );
		onProgress( 'linkCheckProgress', {
			current,
			total,
		} );
	}

	// Process links sequentially to avoid overwhelming servers
	for ( const url of uniqueLinks ) {
		try {
			const result = await fetchBrokenLinkStatus( {
				postId,
				userAgent,
				url,
				allLinks: links,
			} );
			const { success, ...rest } = result;
			cacheBrokenLinksResults.set( url, {
				broken: ! success,
				...rest,
			} );
		} catch ( error ) {
			// If API fails, consider as broken
			cacheBrokenLinksResults.set( url, {
				broken: true,
				status: error?.data?.status ?? error?.code ?? 'error',
				details: error.message,
				message: __( 'Failed to check link', 'surerank' ),
			} );
		}
		current++;
		if ( typeof onProgress === 'function' ) {
			onProgress( 'linkCheckProgress', {
				current,
				total,
			} );
		}

		// Add small delay between requests to prevent rate limiting
		if ( current < total ) {
			await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
		}
	}
	onProgress( 'isCheckingLinks', false );

	return getCacheBrokenLinks( links );
};

/**
 * Check for broken links in the document and report results.
 * @param {Document} document
 * @param {number}   postId
 * @param {string}   userAgent
 * @param {Function} onProgress
 * @return {Promise<Object>} createCheck result
 */
export const checkBrokenLinks = async (
	document,
	postId,
	userAgent = window.navigator.userAgent,
	onProgress
) => {
	if ( ! document || ! postId ) {
		return;
	}

	const links = getAllLinks( document );
	if ( ! links.length ) {
		return;
	}

	const brokenLinks = await checkLinks( {
		links,
		postId,
		userAgent,
		onProgress,
	} );

	if ( brokenLinks.length ) {
		return createCheck( {
			id: 'broken_links',
			title: __(
				'One or more broken links found on the page.',
				'surerank'
			),
			status: 'error',
			data: brokenLinks,
		} );
	}

	return createCheck( {
		id: 'broken_links',
		title: __( 'No broken links found on the page.', 'surerank' ),
		status: 'success',
		description: [],
	} );
};

export const checkCanonicalUrl = ( canonical ) => {
	if ( ! canonical ) {
		return createCheck( {
			id: 'canonical_url',
			title: __(
				'Canonical tag is not present on the page.',
				'surerank'
			),
			status: 'warning',
		} );
	}

	return createCheck( {
		id: 'canonical_url',
		title: __( 'Canonical tag is present on the page.', 'surerank' ),
		status: 'success',
	} );
};

/**
 * Fetch broken link status from the API.
 *
 * @param {Object}   params
 * @param {number}   params.postId
 * @param {string}   params.userAgent
 * @param {string}   params.url
 * @param {string[]} params.allLinks
 * @return {Promise<Object>} API response
 */
export const fetchBrokenLinkStatus = async ( {
	postId,
	userAgent,
	url,
	allLinks,
} ) => {
	return await apiFetch( {
		path: '/surerank/v1/checks/broken-link',
		method: 'POST',
		data: {
			post_id: postId,
			user_agent: userAgent,
			url,
			urls: allLinks,
		},
	} );
};
