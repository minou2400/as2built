import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { LockIcon } from 'lucide-react';
import FixButton from '@GlobalComponents/fix-button';
import {
	REQUIRE_CONTENT_GENERATION,
	SEO_FIX_TYPE_MAPPING,
} from '@Global/constants';

const SHOW_FIX_BUTTON_FOR = [
	...new Set( [
		...REQUIRE_CONTENT_GENERATION,
		...Object.keys( SEO_FIX_TYPE_MAPPING ),
	] ),
];

/**
 * SiteSeoChecksFixButton component that renders a FixButton with consistent logic
 * @param {Object} props                 - Component props
 * @param {Object} props.selectedItem    - The selected item object containing status and other properties
 * @param {Object} props.additionalProps - Additional props to pass to the FixButton
 * @return {JSX.Element} The rendered FixButton component
 */
const SiteSeoChecksFixButton = ( { selectedItem, ...additionalProps } ) => {
	const fixItButtonProps = useMemo(
		() => ( {
			buttonLabel: ! REQUIRE_CONTENT_GENERATION.includes(
				selectedItem?.id
			)
				? __( 'Fix It For Me', 'surerank' )
				: __( 'Help Me Fix', 'surerank' ),
			...additionalProps,
			hidden: true,
			id: selectedItem?.id,
			category: selectedItem?.category ?? '',
		} ),
		[ selectedItem, additionalProps ]
	);

	if ( ! SHOW_FIX_BUTTON_FOR.includes( selectedItem.id ) ) {
		return null;
	}

	const ProFixButton = applyFilters(
		'surerank-pro.dashboard.site-seo-checks-fix-it-button'
	);

	return ProFixButton ? (
		<ProFixButton { ...fixItButtonProps } />
	) : (
		<FixButton
			icon={ <LockIcon /> }
			tooltipProps={ { className: 'z-999999' } }
			locked={ true }
			{ ...fixItButtonProps }
		/>
	);
};

export default SiteSeoChecksFixButton;
