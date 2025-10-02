import { mountComponent } from '@Functions/utils';
import createAdminRouter, {
	createRoute,
	createChildRoute,
} from '@Functions/router';
import Dashboard from './dashboard';
import { Toaster, toast } from '@bsf/force-ui';
import { getNavLinks } from '@Global/constants/nav-links';
import { Navigate } from '@tanstack/react-router';
import SidebarLayout from '@AdminComponents/layout/sidebar-layout';
import SearchConsole from '../admin-search-console';
import {
	ENABLE_GOOGLE_CONSOLE,
	ENABLE_SCHEMAS,
	ENABLE_MIGRATION,
} from '@Global/constants';
import { applyFilters } from '@wordpress/hooks';

// Import all the components directly
import TitleAndDescriptionRoute from '@AdminGeneral/general/title-and-description/title-and-description';
import HomePageRoute from '@AdminGeneral/general/home-page/home-page';
import ArchivePagesRoute from '@AdminGeneral/advanced/archive-pages/archive-pages';
import SocialGeneralRoute from '@AdminGeneral/social/general/general';
import FacebookRoute from '@AdminGeneral/social/facebook/facebook';
import TwitterRoute from '@AdminGeneral/social/twitter/twitter';
import AccountRoute from '@AdminGeneral/social/account/account';
import RobotInstructionsRoute from '@AdminGeneral/advanced/robot-instructions/robot-instructions';
import SitemapsRoute from '@AdminGeneral/advanced/sitemaps/sitemaps';
import FeaturesManagementRoute from '@AdminGeneral/advanced/features-management/features-management';
import ContentAnalysisRoute from '@AdminDashboard/content-analysis/content-analysis';
import SiteSeoChecksRoute from '@AdminDashboard/site-seo-checks/site-seo-checks-main';
import MigrationRoute from '@AdminGeneral/advanced/tools/migration';
import MiscellaneousRoute from '@AdminGeneral/advanced/tools/miscellaneous';
import RobotsTxtEditorRoute from '@AdminGeneral/advanced/tools/robots-txt-editor/robots-txt-editor';
import SchemaRoute from '@AdminGeneral/schema/schema';
import ImportExportSettingsRoute from '@AdminGeneral/advanced/tools/import-export-settings';

// Define toast globally for PRO plugin.
if ( window && ! window?.toast ) {
	window.toast = toast;
}

// Routes
const dashboardRoutes = [
	// Default route redirects to dashboard
	createRoute( '/', () => <Navigate to="/dashboard" />, {
		navbarOnly: true,
	} ),
	// Dashboard routes
	createRoute( '/dashboard', Dashboard, { navbarOnly: true } ),
];

const generalAndAdvancedRoutes = [
	// General routes
	createRoute( '/general', TitleAndDescriptionRoute ),
	createRoute( '/general/homepage', null, [
		createChildRoute( '/', HomePageRoute ),
		createChildRoute( '/social', HomePageRoute ),
		createChildRoute( '/advanced', HomePageRoute ),
	] ),
	createChildRoute( '/general/archive_pages', ArchivePagesRoute ),
	createRoute( '/general/social', null, [
		createChildRoute( '/', SocialGeneralRoute ),
		createChildRoute( '/facebook', FacebookRoute ),
		createChildRoute( '/x', TwitterRoute ),
		createChildRoute( '/accounts', AccountRoute ),
	] ),

	// Advanced routes
	createRoute( '/advanced', null, [
		createRoute( '/robot_instructions', null, [
			createChildRoute( '/indexing', RobotInstructionsRoute ),
			createChildRoute( '/following', RobotInstructionsRoute ),
			createChildRoute( '/archiving', RobotInstructionsRoute ),
		] ),
		createChildRoute( '/sitemaps', SitemapsRoute ),

		// Conditionally include schema route
		...( ENABLE_SCHEMAS && SchemaRoute
			? [ createChildRoute( '/schema', SchemaRoute ) ]
			: [] ),
		createChildRoute( '/robots-txt-editor', RobotsTxtEditorRoute ),
	] ),
];

const searchConsoleRoutes = [
	createRoute( '/search-console', SearchConsole, { navbarOnly: true } ),
	createRoute( '/content-performance', ContentAnalysisRoute, {
		navbarOnly: true,
	} ),
];

const siteSeoAnalysisRoutes = [
	createRoute( '/site-seo-analysis', SiteSeoChecksRoute, {
		navbarOnly: true,
	} ),
];

// Tools routes
const toolsRoutes = [
	createRoute( '/tools', null, [
		createChildRoute( '/manage-features', FeaturesManagementRoute ),
		createChildRoute( '/import-export', ImportExportSettingsRoute ),
		...( ENABLE_MIGRATION
			? [ createChildRoute( '/migrate', MigrationRoute ) ]
			: [] ),
		createChildRoute( '/miscellaneous', MiscellaneousRoute ),
	] ),
];

// Combine all routes
export const routes = applyFilters( 'surerank-pro.routes', [
	...dashboardRoutes,
	...generalAndAdvancedRoutes,
	...toolsRoutes,
	...siteSeoAnalysisRoutes,
	// Conditionally include search console routes
	...( ENABLE_GOOGLE_CONSOLE ? searchConsoleRoutes : [] ),
] );

// Navigation Links
export const navLinks = getNavLinks();

// Create router using the original createAdminRouter but with custom layout
const Router = createAdminRouter( {
	navLinks,
	routes,
	defaultLayout: {
		component: SidebarLayout,
		props: {},
	},
} );

const App = () => {
	return (
		<>
			<Router />
			<Toaster className="z-999999" />
		</>
	);
};

mountComponent( '#surerank-root', <App /> );
