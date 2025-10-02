import { __ } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';
import { SettingsScreen } from '@SeoPopup/components';

export const SCREENS = applyFilters( 'surerank-pro.seo-popup-screens', {
	settings: {
		title: __( 'Settings', 'surerank' ),
		component: SettingsScreen,
	},
} );
