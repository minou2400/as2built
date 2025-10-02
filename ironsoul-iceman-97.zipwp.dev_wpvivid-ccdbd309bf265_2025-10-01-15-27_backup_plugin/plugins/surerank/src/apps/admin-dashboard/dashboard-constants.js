import {
	Type,
	House,
	Share2,
	Network,
	Bot,
	Globe,
	Rss,
	GitFork,
	ArrowLeftRight,
} from 'lucide-react';
import { __ } from '@wordpress/i18n';
import {
	AstraLogo,
	SpectraLogo,
	SureMailIcon,
	SureFormsIcon,
	UAE,
} from '@GlobalComponents/icons';

export const FETCH_STATUS = {
	IDLE: 'idle',
	LOADING: 'loading',
	INSTALLING: 'installing',
	ACTIVATING: 'activating',
	SUCCESS: 'success',
	ERROR: 'error',
};

export const quickLinks = [
	{
		label: __( 'Title & Description', 'surerank' ),
		description: __(
			'Manage titles and meta descriptions to boost your search rankings.',
			'surerank'
		),
		icon: Type,
		link: '/',
	},
	{
		label: __( 'Home Page', 'surerank' ),
		description: __(
			'Set SEO options for your homepage to improve its search visibility.',
			'surerank'
		),
		icon: House,
		link: '/homepage',
	},
	{
		label: __( 'Social Network', 'surerank' ),
		description: __(
			'Configure how your content appears when shared on social media platforms.',
			'surerank'
		),
		icon: Share2,
		link: '/social',
	},
	{
		label: __( 'Sitemaps', 'surerank' ),
		description: __(
			'Generate XML sitemaps to help search engines crawl your site.',
			'surerank'
		),
		icon: Network,
		link: '/advanced/sitemaps',
	},
	{
		label: __( 'Robot Instructions', 'surerank' ),
		description: __(
			'Configure robots.txt to guide search engines on crawling.',
			'surerank'
		),
		icon: Bot,
		link: '/advanced/robot_instructions',
	},
	{
		label: __( 'Crawl Optimization', 'surerank' ),
		description: __(
			'Adjust crawl settings to improve search engine indexing.',
			'surerank'
		),
		icon: Globe,
		link: '/advanced/crawl_optimization',
	},
	{
		label: __( 'Feeds', 'surerank' ),
		description: __(
			'Manage RSS feeds to keep search engines updated with your latest content.',
			'surerank'
		),
		icon: Rss,
		link: '/advanced/feeds',
	},
	{
		label: __( 'Schema', 'surerank' ),
		description: __(
			'Add structured data to enhance search engine understanding.',
			'surerank'
		),
		icon: GitFork,
		link: '/advanced/schema',
	},
	{
		label: __( 'Import/Export', 'surerank' ),
		description: __(
			'Transfer SEO settings or backup configurations with ease.',
			'surerank'
		),
		icon: ArrowLeftRight,
		disabled: true,
		badge: __( 'Planned', 'surerank' ),
	},
];

export const dashboard_plugins_sequence = [
	'ultimate-addons-for-gutenberg',
	'sureforms',
	'suremails',
	'header-footer-elementor',
];

export const themesAndPlugins = [
	{
		name: __( 'Astra Theme', 'surerank' ),
		description: __(
			'Fast and customizable theme for your website.',
			'surerank'
		),
		icon: AstraLogo,
		slug: 'astra',
		type: 'theme',
	},
	{
		name: __( 'Spectra', 'surerank' ),
		description: __( 'Free WordPress Page Builder Plugin.', 'surerank' ),
		icon: SpectraLogo,
		slug: 'ultimate-addons-for-gutenberg',
		type: 'plugin',
	},
	{
		name: __( 'SureMail', 'surerank' ),
		description: __(
			'Connect and send emails via SMTP connections.',
			'surerank'
		),
		icon: SureMailIcon,
		slug: 'suremails',
		type: 'plugin',
	},
	{
		name: __( 'SureForms', 'surerank' ),
		description: __( 'Best no code WordPress form builder', 'surerank' ),
		icon: SureFormsIcon,
		slug: 'sureforms',
		type: 'plugin',
	},
	{
		name: __( 'Ultimate Addons for Elementor', 'surerank' ),
		description: __(
			'Build modern websites with elementor addons.',
			'surerank'
		),
		icon: UAE,
		slug: 'header-footer-elementor',
		type: 'plugin',
	},
];
