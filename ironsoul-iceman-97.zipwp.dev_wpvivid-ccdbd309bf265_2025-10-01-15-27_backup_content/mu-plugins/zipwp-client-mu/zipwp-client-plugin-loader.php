<?php
/**
 * Plugin Loader.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT;

use ZIPWP_CLIENT\Inc\Api\ApiInit;
use ZIPWP_CLIENT\Inc\Admin\Onboarding;
use ZIPWP_CLIENT\Inc\Admin\Dashboard;
use ZIPWP_CLIENT\Inc\Admin\SiteProtection;
use ZIPWP_CLIENT\Inc\Admin\SiteProgress;
use ZIPWP_CLIENT\Inc\Frontend\Frontend;
use ZIPWP_CLIENT\Inc\Updater;
use ZIPWP_CLIENT\Inc\Admin\Helper;

/**
 * Plugin_Loader
 *
 * @since 1.1.0
 */
class Plugin_Loader {

	/**
	 * Instance
	 *
	 * @access private
	 * @var object Class Instance.
	 * @since 1.1.0
	 */
	private static $instance = null;

	/**
	 * Initiator
	 *
	 * @since 1.1.0
	 * @return object initialized object of class.
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Autoload classes.
	 *
	 * @since 1.1.0
	 * @param string $class class name.
	 *
	 * @return void
	 */
	public function autoload( $class ) {
		if ( 0 !== strpos( $class, __NAMESPACE__ ) ) {
			return;
		}

		$class_to_load = preg_replace(
			[ '/^' . __NAMESPACE__ . '\\\/', '/([a-z])([A-Z])/', '/_/', '/\\\/' ],
			[ '', '$1-$2', '-', DIRECTORY_SEPARATOR ],
			$class
		);

		if ( empty( $class_to_load ) ) {
			return;
		}

		$filename = strtolower( $class_to_load );

		$file = ZIPWP_CLIENT_DIR . $filename . '.php';

		// if the file redable, include it.
		if ( is_readable( $file ) ) {
			require_once $file;
		}
	}

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {

		spl_autoload_register( [ $this, 'autoload' ] );

		add_action( 'plugins_loaded', [ $this, 'load_classes' ], 888 );
		add_action( 'plugins_loaded', [ $this, 'load_textdomain' ] );

		add_filter( 'getting_started_vars', [ $this, 'add_site_details_to_getting_started_vars' ] );
	}

	/**
	 * Add site details to Getting Started variables.
	 *
	 * @param array<string, mixed> $vars The Getting Started variables.
	 * @return array<string, mixed> The modified Getting Started variables.
	 */
	public function add_site_details_to_getting_started_vars( $vars ) {

		$vars['siteDetails'] = array(
			'uuid' => Helper::get_site_uuid(),
		);

		return $vars;
	}


	/**
	 * Loads plugin classes as per requirement.
	 *
	 * @return void
	 * @since  0.0.2
	 */
	public function load_classes() {

		// Load Getting Started library.
		$this->getting_started_load_files();

		// Initialize plugin classes.
		ApiInit::instance();
		Dashboard::instance();
		Onboarding::instance();
		SiteProgress::instance();
		SiteProtection::instance();
		Frontend::instance();
		// Updater.
		Updater::instance();
	}

	/**
	 * Getting started option name.
	 *
	 * @return string
	 */
	public function getting_started_option_name() {
		return 'zipwp_show_getting_started_wizard';
	}

	/**
	 * Getting Started Logo.
	 *
	 * @return string
	 */
	public function getting_started_logo_url() {
		return ZIPWP_CLIENT_URL . 'inc/lib/getting-started/assets/images/zipwp-logo.svg';
	}

	/**
	 * Load Getting Started files.
	 *
	 * @return void
	 */
	public function getting_started_load_files() {

		// Set the getting started wizard option to true.
		add_filter( 'getting_started_wizard_option_name', [ $this, 'getting_started_option_name' ] );
		// Customize the Finish Setup logo.
		add_filter( 'getting_started_logo_url', [ $this, 'getting_started_logo_url' ] );

		// Load the Getting Started library.
		$file_to_load = ZIPWP_CLIENT_DIR . 'inc/lib/getting-started/getting-started.php';
		if ( ! class_exists( 'Getting_Started_Plugin_Loader' ) && file_exists( $file_to_load ) ) {
			require_once $file_to_load;
		}
	}

	/**
	 * Load Plugin Text Domain.
	 * This will load the translation textdomain depending on the file priorities.
	 *      1. Global Languages /wp-content/languages/plugin-base/ folder
	 *      2. Local dorectory /wp-content/plugins/plugin-base/languages/ folder
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function load_textdomain() {
		// Default languages directory.
		$lang_dir = ZIPWP_CLIENT_DIR . 'languages/';

		/**
		 * Filters the languages directory path to use for plugin.
		 *
		 * @param string $lang_dir The languages directory path.
		 */
		$lang_dir = apply_filters( 'zipwp_client_languages_directory', $lang_dir );

		// Traditional WordPress plugin locale filter.
		global $wp_version;

		$get_locale = get_locale();

		if ( $wp_version >= 4.7 ) {
			$get_locale = get_user_locale();
		}

		/**
		 * Language Locale for plugin
		 *
		 * Uses get_user_locale()` in WordPress 4.7 or greater,
		 * otherwise uses `get_locale()`.
		 */
		$locale = apply_filters( 'plugin_locale', $get_locale, 'zipwp-client' );
		$mofile = sprintf( '%1$s-%2$s.mo', 'zipwp-client', $locale );

		// Setup paths to current locale file.
		$mofile_global = WP_LANG_DIR . '/plugins/' . $mofile;
		$mofile_local  = $lang_dir . $mofile;

		if ( file_exists( $mofile_global ) ) {
			// Look in global /wp-content/languages/zipwp-client/ folder.
			load_textdomain( 'zipwp-client', $mofile_global );
		} elseif ( file_exists( $mofile_local ) ) {
			// Look in local /wp-content/plugins/zipwp-client/languages/ folder.
			load_textdomain( 'zipwp-client', $mofile_local );
		} else {
			// Load the default language files.
			load_plugin_textdomain( 'zipwp-client', false, $lang_dir );
		}
	}
}

/**
 * Kicking this off by calling 'instance()' method
 */
Plugin_Loader::instance();
