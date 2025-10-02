<?php
/**
 * Create site.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Admin;

use ZIPWP_CLIENT\Inc\Traits\Instance;

/**
 * Onboarding
 *
 * @since 1.1.0
 */
class Onboarding {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'register_ai_screen_scripts' ), 99999 );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_preview_scripts' ) );
		add_action( 'init', array( $this, 'maybe_start_self_destruction' ) );
		add_action( 'zipwp_companion_self_destruct', array( $this, 'start_companion_destruction' ), 999 );
	}

	/**
	 * Load Google fonts.
	 *
	 * @since 0.0.7
	 * @return void
	 */
	public function load_google_fonts() {

		$google_fonts = array(
			'"Source Sans Pro", sans-serif'  => array(
				'family'  => 'Source+Sans+Pro',
				'weights' => array( 400 ),
			),
			"'Playfair Display', serif"      => array(
				'family'  => 'Playfair+Display',
				'weights' => array( 700 ),
			),
			"'Lato', sans-serif"             => array(
				'family'  => 'Lato',
				'weights' => array( 400 ),
			),
			"'Poppins', sans-serif"          => array(
				'family'  => 'Poppins',
				'weights' => array( 700 ),
			),
			"'Montserrat', sans-serif"       => array(
				'family'  => 'Montserrat',
				'weights' => array( 700 ),
			),
			"'Karla', sans-serif"            => array(
				'family'  => 'Karla',
				'weights' => array( 400 ),
			),
			"'Rubik', sans-serif"            => array(
				'family'  => 'Rubik',
				'weights' => array( 700 ),
			),
			"'Roboto', sans-serif"           => array(
				'family'  => 'Roboto',
				'weights' => array( 400 ),
			),
			"'Roboto Condensed', sans-serif" => array(
				'family'  => 'Roboto+Condensed',
				'weights' => array( 700 ),
			),
			"'Inter', sans-serif"            => array(
				'family'  => 'Inter',
				'weights' => array( 400 ),
			),
			"'Merriweather', serif"          => array(
				'family'  => 'Merriweather',
				'weights' => array( 700 ),
			),
			"'Open Sans', sans-serif"        => array(
				'family'  => 'Open+Sans',
				'weights' => array( 400 ),
			),
			"'Vollkorn', serif"              => array(
				'family'  => 'Vollkorn',
				'weights' => array( 700 ),
			),
			"'Work Sans', sans-serif"        => array(
				'family'  => 'Work+Sans',
				'weights' => array( 700 ),
			),
		);

		$font_families = array();

		foreach ( $google_fonts as $font => $font_data ) {
			$family          = $font_data['family'];
			$weights         = implode( ',', $font_data['weights'] );
			$font_families[] = $family . ':' . $weights;

		}

		$google_font_url = 'https://fonts.googleapis.com/css?family=' . implode( '|', $font_families );

		wp_enqueue_style( 'zipwp-google-fonts', esc_url( $google_font_url ), array(), ZIPWP_CLIENT_VER, 'all' );
	}

	/**
	 * Maybe start self destruction.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function maybe_start_self_destruction() {

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}

		$site_host = wp_parse_url( get_site_url(), PHP_URL_HOST );

		if ( empty( $site_host ) || ! is_string( $site_host ) ) {
			return;
		}

		$domain      = str_replace( 'www.', '', $site_host );
		$site_domain = str_replace( '.', '-', $domain );

		$stored_domain = get_option( 'zipwp_domain', '' );

		if ( empty( $stored_domain ) ) {
			update_option( 'zipwp_domain', $site_domain );
			return;
		}

		if ( $stored_domain !== $site_domain ) {
			$this->start_self_destruct();
		}
	}

	/**
	 * Start companion self destruction.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function start_companion_destruction() {
		$this->delete_companion_plugin();
	}

	/**
	 * Start self destruction.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function start_self_destruct() {

		$this->delete_companion_plugin();

		$this->delete_self_directory();

	}

	/**
	 * Delete companion plugin.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function delete_companion_plugin() {

		$plugin_to_delete = 'zipwp-companion-mu.php';
		$plugin_file_path = WPMU_PLUGIN_DIR . '/' . $plugin_to_delete;

		if ( file_exists( $plugin_file_path ) ) {
			unlink( $plugin_file_path );
		}

		$this->delete_directory( WPMU_PLUGIN_DIR . '/zipwp-companion-mu' );
	}

	/**
	 * Delete self directory.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function delete_self_directory() {

		$plugin_to_delete = 'zipwp-client-mu.php';
		$plugin_file_path = WPMU_PLUGIN_DIR . '/' . $plugin_to_delete;

		if ( file_exists( $plugin_file_path ) ) {
			unlink( $plugin_file_path );
		}

		$this->delete_directory( WPMU_PLUGIN_DIR . '/zipwp-client-mu' );
	}

	/**
	 * Delete directory.
	 *
	 * @since 1.1.0
	 * @param string $dir Directory path.
	 * @return bool
	 */
	public function delete_directory( $dir ) {

		if ( ! is_dir( $dir ) ) {
			return false;
		}

		$files = scandir( $dir );

		if ( is_array( $files ) ) {
			foreach ( $files as $file ) {
				if ( '.' !== $file && '..' !== $file ) {
					if ( is_dir( $dir . '/' . $file ) ) {
						$this->delete_directory( $dir . '/' . $file );
					} else {
						unlink( $dir . '/' . $file );
					}
				}
			}
		}
		return rmdir( $dir );
	}

	/**
	 * Add menu page.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function admin_menu() {

		add_submenu_page(
			'themes.php',
			'Move to Host',
			'Move to Host',
			'manage_options',
			'move-to-host',
			array( $this, 'move_to_host_menu_callback' ),
			70
		);

		if ( ! defined( 'ASTRA_THEME_VERSION' ) ) {
			return;
		}

		add_submenu_page(
			'themes.php',
			'ZipWP',
			'ZipWP',
			'manage_options',
			'ai',
			array( $this, 'menu_callback' ),
			80
		);
	}

	/**
	 * Menu callback
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function menu_callback() {
		?><div id="zipwp-client-app"></div>
		<?php
	}

	/**
	 * Menu callback
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function move_to_host_menu_callback() {
		?>
		<div id="zipwp-move-to-host-page"></div>
		<?php
	}

	/**
	 * Register scripts.
	 *
	 * @return void
	 * @param string $hook Hook name.
	 * @since  0.0.2
	 */
	public function register_ai_screen_scripts( $hook ) {

		if ( 'appearance_page_ai' !== $hook ) {
			return;
		}

		$handle       = 'zipwp-client-dashboard';
		$js_deps_file = ZIPWP_CLIENT_BUILD_DIR . 'dashboard/main.asset.php';
		$js_dep       = [
			'dependencies' => array(),
			'version'      => ZIPWP_CLIENT_VER,
		];

		if ( file_exists( $js_deps_file ) ) {

			$script_info = include_once $js_deps_file;

			if ( isset( $script_info['dependencies'] ) && isset( $script_info['version'] ) ) {
				$js_dep['dependencies'] = $script_info['dependencies'];
				$js_dep['version']      = $script_info['version'];
			}
		}

		wp_register_style( $handle, ZIPWP_CLIENT_BUILD_URL . 'dashboard/style-main.css', [], ZIPWP_CLIENT_VER );
		wp_register_script( $handle, ZIPWP_CLIENT_BUILD_URL . 'dashboard/main.js', $js_dep['dependencies'], $js_dep['version'], true );

		$show_title = function_exists( 'astra_get_option' ) ? astra_get_option( 'display-site-title-responsive' ) : [];

		wp_localize_script(
			$handle,
			'zipwp_client_dashboard',
			array(
				'rest_root'          => esc_url_raw( rest_url() ),
				'rest_nonce'         => wp_create_nonce( 'wp_rest' ),
				'ajax_url'           => esc_url_raw( admin_url( 'admin-ajax.php', 'relative' ) ),
				'site_url'           => esc_url_raw( get_site_url() ),
				'site_name'          => get_bloginfo( 'name' ),
				'default_typography' => get_option( 'zipwp_default_typography', [] ),
				'default_colors'     => get_option( 'zipwp_default_colors', [] ),
				'color_scheme'       => Helper::get_site_details( 'color_scheme' ),
				'show_site_title'    => is_array( $show_title ) && 1 === $show_title['desktop'] ? true : false,
			)
		);
		remove_all_actions( 'admin_notices' );

		wp_enqueue_style( 'zipwp-client-dashboard' );
		wp_enqueue_media();
		wp_enqueue_script( 'zipwp-client-dashboard' );

		$this->load_google_fonts();
	}

	/**
	 * Register scripts.
	 *
	 * @return void
	 * @since  0.0.2
	 */
	public function register_preview_scripts() {

		if ( isset( $_GET['customize_changeset_uuid'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$handle       = 'zipwp-client-preview';
		$js_deps_file = ZIPWP_CLIENT_BUILD_DIR . 'template-preview/main.asset.php';
		$js_dep       = [
			'dependencies' => array(),
			'version'      => ZIPWP_CLIENT_VER,
		];

		if ( file_exists( $js_deps_file ) ) {

			$script_info = include_once $js_deps_file;

			if ( isset( $script_info['dependencies'] ) && isset( $script_info['version'] ) ) {
				$js_dep['dependencies'] = $script_info['dependencies'];
				$js_dep['version']      = $script_info['version'];
			}
		}

		wp_register_script( $handle, ZIPWP_CLIENT_BUILD_URL . 'template-preview/main.js', $js_dep['dependencies'], $js_dep['version'], true );

		$color_palette_prefix     = '--ast-global-';
		$ele_color_palette_prefix = '--ast-global-';

		if ( class_exists( 'Astra_Global_Palette' ) ) {

			$astra_callable_class = new \Astra_Global_Palette();

			if ( is_callable( array( $astra_callable_class, 'get_css_variable_prefix' ) ) ) {
				$color_palette_prefix = \Astra_Global_Palette::get_css_variable_prefix();
			}

			if ( is_callable( array( $astra_callable_class, 'get_palette_slugs' ) ) ) {
				$ele_color_palette_prefix = \Astra_Global_Palette::get_palette_slugs();
			}
		}

		wp_localize_script(
			$handle,
			'zipwp_client_preview',
			array(
				'AstColorPaletteVarPrefix'    => $color_palette_prefix,
				'AstEleColorPaletteVarPrefix' => $ele_color_palette_prefix,
			)
		);

		wp_enqueue_script( $handle );
		wp_add_inline_style( 'zipwp-client-preview-custom', '#wpadminbar { display: none !important; }' );
	}

	/**
	 * Genereate and return the Google fonts url.
	 *
	 * @since 0.0.7
	 * @return string
	 */
	public function google_fonts_url() {

		$fonts_url     = '';
		$font_families = array(
			'Inter:400,500,600',
		);

		$query_args = array(
			'family' => rawurlencode( implode( '|', $font_families ) ),
			'subset' => rawurlencode( 'latin,latin-ext' ),
		);

		$fonts_url = add_query_arg( $query_args, '//fonts.googleapis.com/css' );

		return $fonts_url;
	}
}
