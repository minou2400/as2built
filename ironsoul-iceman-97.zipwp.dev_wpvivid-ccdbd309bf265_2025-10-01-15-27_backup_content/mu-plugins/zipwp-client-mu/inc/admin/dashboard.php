<?php
/**
 * Create site.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Admin;

use ZIPWP_CLIENT\Inc\Traits\Instance;
use ZIPWP_CLIENT\Inc\Admin\Helper;

/**
 * Dashboard
 *
 * @since 1.1.0
 */
class Dashboard {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
		// phpcs:disable
		// add_action( 'admin_enqueue_scripts', array( $this, 'register_notice_screen_scripts' ) );
		// add_action( 'admin_notices', array( $this, 'show_site_details' ) );. // phpcs:ignore // phpstan:ignore
		// add_action( 'admin_bar_menu', array( $this, 'add_custom_admin_bar_menu_item' ), 999 );. // phpcs:ignore
		// phpcs:enable
		global $wp_version;

		// Hide the unwanted notices and sidebar menu items.
		add_action( 'wp_ajax_zipwp_client_hide_dashboard_notice', array( $this, 'hide_notice' ) );
		add_filter( 'astra_showcase_starter_templates_notice', array( $this, 'maybe_hide_astra_notice' ) );
		add_action( 'admin_head', array( $this, 'hide_zipwp_submenu' ) );

		// Plugin install redirection scripts.
		add_action( 'admin_enqueue_scripts', array( $this, 'load_redirection_scripts' ) );

		// Admin menu items compatibility.
		$menu_priority = ( version_compare( $wp_version, '6.6', '>=' ) ) ? 6 : 999;

		// Move to host menu item and scripts.
		add_action( 'admin_bar_menu', array( $this, 'move_to_host_admin_bar_menu' ), $menu_priority );
		add_action( 'admin_enqueue_scripts', array( $this, 'register_host_screen_scripts' ), 99999 );
		add_action( 'wp_ajax_zipwp_activate_plugin', array( $this, 'activate_plugin' ) );

		// Guest Timer menu item.
		add_action( 'admin_bar_menu', array( $this, 'guest_timer_admin_bar_menu' ), $menu_priority );
		// Guest Timer menu actions scripts.
		add_action( 'admin_enqueue_scripts', array( $this, 'guest_timer_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'guest_timer_scripts' ) );
	}

	/**
	 * Active Plugin.
	 *
	 * @return void
	 */
	public function activate_plugin() {

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied!' ) );
		}

		/**
		 * Nonce verification
		 */
		if ( ! check_ajax_referer( 'zipwp-activate-plugin', 'security', false ) ) {
			wp_send_json_error( array( 'message' => 'Nonce verification failed!' ) );
		}

		\wp_clean_plugins_cache();

		$plugin_init = ( isset( $_POST['init'] ) ) ? sanitize_text_field( $_POST['init'] ) : '';

		$do_sliently = true;

		$activate = \activate_plugin( $plugin_init, '', false, $do_sliently );

		if ( is_wp_error( $activate ) ) {
			wp_send_json_error(
				array(
					'success' => false,
					'message' => $activate->get_error_message(),
				)
			);
		}

		wp_send_json_success(
			array(
				'success' => true,
				'message' => 'Plugin activated successfully.',
			)
		);
	}

	/**
	 * Move to host admin bar menu.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function move_to_host_admin_bar_menu() {

		if ( 'blank' === Helper::get_site_details( 'site_type' ) ) {
			return;
		}

		global $wp_admin_bar;

		$wp_admin_bar->add_menu(
			array(
				'id'     => 'move-to-host',
				'title'  => $this->get_menu_title(),
				'href'   => $this->get_move_to_host_menu_url(),
				'parent' => 'top-secondary',
				'meta'   => array(
					'class' => 'zipwp-move-to-host-menu-item',
				),
			)
		);
	}

	/**
	 * Get Move to host menu title.
	 *
	 * @since 1.1.0
	 *
	 * @return string
	 */
	public function get_menu_title() {
		return __( 'Connect Domain & Go Live', 'zipwp-client' );
	}

	/**
	 * Get Move to host menu URL.
	 *
	 * @since 1.1.0
	 *
	 * @return string
	 */
	public function get_move_to_host_menu_url() {

		$cloud_plan_details = Helper::get_cloud_plan_slug();
		$app_url            = 'https://app.zipwp.com';
		$utm_source         = 'zipwp-client-adminbar';
		$utm_medium         = 'connect-domain-cta';

		if ( empty( $cloud_plan_details ) ) {
			return "{$app_url}/cloud-pricing?utm_source={$utm_source}&utm_medium={$utm_medium}";
		}

		$site_uuid = Helper::get_site_uuid();
		return "{$app_url}/sites?uuid={$site_uuid}&utm_source={$utm_source}&utm_medium={$utm_medium}";
	}

	/**
	 * Move to host admin bar menu.
	 *
	 * @since 1.1.0
	 *
	 * @return void
	 */
	public function guest_timer_admin_bar_menu() {

		global $wp_admin_bar;

		$login_info = $this->get_login_information();

		if ( ! empty( $login_info ) ) {
			$wp_admin_bar->add_menu(
				array(
					'id'     => 'zipwp_custom_login_menu',
					'title'  => 'Login',
					'href'   => '',
					'parent' => 'top-secondary',
					'meta'   => array(
						'class'  => 'zipwp-site-login-details',
						'target' => '_blank',
						'title'  => 'Login',
					),
				)
			);
		}

		$expire_at = Helper::get_site_details( 'expire_at' );

		if ( ! Helper::is_site_reserved() && '' !== $expire_at ) {
			$wp_admin_bar->add_menu(
				array(
					'id'     => 'zipwp_custom_timer_menu',
					'title'  => 'Expires in 00:00:30:00',
					'href'   => '',
					'parent' => 'top-secondary',
					'meta'   => array(
						'class'  => 'zipwp-site-timer-details',
						'target' => '_blank',
						'title'  => '', // Not needed.
					),
				)
			);
		}
	}

	/**
	 * Get plugin status
	 *
	 * @since 1.1.4
	 *
	 * @param  string $plugin_init_file Plguin init file.
	 * @return mixed
	 */
	public function get_plugin_status( $plugin_init_file ) {

		$installed_plugins = get_plugins();

		if ( ! isset( $installed_plugins[ $plugin_init_file ] ) ) {
			return 'not-installed';
		} elseif ( is_plugin_active( $plugin_init_file ) ) {
			return 'active';
		} else {
			return 'inactive';
		}
	}

	/**
	 * Maybe hide astra notice.
	 *
	 * @since x.x.x
	 *
	 * @param bool $show Show or hide.
	 *
	 * @return bool
	 */
	public function maybe_hide_astra_notice( $show ) {

		if ( 'blank' !== Helper::get_site_details( 'site_type' ) ) {
			$show = false;
		}

		return $show;
	}

	/**
	 * Hide submenu.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function hide_zipwp_submenu() {

		$custom_css = '<style type="text/css">
						#adminmenu a[href="themes.php?page=move-to-host"] {
					display: none;}';

		if ( 'blank' === Helper::get_site_details( 'site_type' ) ) {
			$custom_css .= '#adminmenu a[href="themes.php?page=ai"] {
					display: none;
			}';
		}

		$custom_css .= '</style>';

		// This is a static CSS. Hence ignoring escaping rule.
		echo $custom_css; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

	}

	/**
	 * Show site details.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function add_custom_admin_bar_menu_item() {

		if ( ! $this->allowed_screen_for_notices() || ! $this->is_show_notice() ) {
			return;
		}

		global $wp_admin_bar;

		$wp_admin_bar->add_menu(
			array(
				'id'     => 'zipwp-admin-menu',
				'parent' => 'top-secondary',
				'title'  => 'ZIPWP - Site Insights',
				'href'   => '#',
				'meta'   => array(
					'class' => 'zipwp-menu-item',
				),
			)
		);
	}

	/**
	 * Hide notice.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function hide_notice() {

		$nonce = isset( $_POST['nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['nonce'] ) ) : '';

		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Permission Denied' );
		}

		if ( ! wp_verify_nonce( $nonce, 'zipwp-client-notice' ) ) {
			wp_send_json_error( 'Invalid nonce' );
		}

		if ( 'yes' === get_option( 'zipwp_client_show_dashboard_notice', 'yes' ) ) {
			update_option( 'zipwp_client_show_dashboard_notice', 'no' );
		} else {
			update_option( 'zipwp_client_show_dashboard_notice', 'yes' );
		}

		wp_send_json_success( 'success' );
	}

	/**
	 * Register scripts.
	 *
	 * @return void
	 * @since  0.0.2
	 */
	public function register_notice_screen_scripts() {

		if ( ! $this->allowed_screen_for_notices() || ! $this->is_show_notice() ) {
			return;
		}

		$handle       = 'zipwp-client-notice';
		$js_deps_file = ZIPWP_CLIENT_BUILD_DIR . 'notice/main.asset.php';
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
		wp_register_style( $handle, ZIPWP_CLIENT_BUILD_URL . 'notice/style-main.css', [], ZIPWP_CLIENT_VER );
		wp_register_script( $handle, ZIPWP_CLIENT_BUILD_URL . 'notice/main.js', $js_dep['dependencies'], $js_dep['version'], true );

		/** Variable Declaration.
		 *
		 * @var array<mixed> $site_details
		 */
		$site_details = Helper::get_site_details();

		wp_localize_script(
			$handle,
			'zipwp_client_notice',
			array(
				'rest_root'                => esc_url_raw( rest_url() ),
				'rest_nonce'               => wp_create_nonce( 'wp_rest' ),
				'ajax_url'                 => esc_url_raw( admin_url( 'admin-ajax.php', 'relative' ) ),
				'dashboard_notice_nonce'   => wp_create_nonce( 'zipwp-client-notice' ),
				'site_url'                 => esc_url_raw( get_site_url() ),
				'site_name'                => get_bloginfo( 'name' ),
				'username'                 => $site_details['username'],
				'password'                 => $site_details['password'],
				'expire_at'                => $site_details['expire_at'],
				'reserve'                  => $site_details['reserve'],
				'is_show_dashboard_notice' => get_option( 'zipwp_client_show_dashboard_notice', 'yes' ),
			)
		);

		wp_enqueue_style( 'zipwp-client-notice' );
		wp_enqueue_script( 'zipwp-client-notice' );
		wp_enqueue_script( 'zipwp-admin-bar', ZIPWP_CLIENT_URL . 'inc/admin/assets/js/dashboard.js', array( 'jquery' ), ZIPWP_CLIENT_VER, true );
	}

	/**
	 * Register scripts.
	 *
	 * @return void
	 * @since  0.0.2
	 */
	public function register_host_screen_scripts() {

		if ( 'blank' === Helper::get_site_details( 'site_type' ) ) {
			return;
		}

		if ( ! isset( $_GET['page'] ) || 'move-to-host' !== $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$handle       = 'zipwp-client-host-sceen';
		$js_deps_file = ZIPWP_CLIENT_BUILD_DIR . 'host/main.asset.php';
		$js_dep       = [
			'dependencies' => array( 'jquery', 'wp-util', 'updates', 'media-upload' ),
			'version'      => ZIPWP_CLIENT_VER,
		];

		if ( file_exists( $js_deps_file ) ) {

			$script_info = include_once $js_deps_file;

			if ( isset( $script_info['dependencies'] ) && isset( $script_info['version'] ) ) {
				$js_dep['dependencies'] = array_merge( $script_info['dependencies'], array( 'updates' ) );

				$js_dep['version'] = $script_info['version'];
			}
		}
		wp_register_style( $handle, ZIPWP_CLIENT_BUILD_URL . 'host/style-main.css', [], ZIPWP_CLIENT_VER );
		wp_register_script( $handle, ZIPWP_CLIENT_BUILD_URL . 'host/main.js', $js_dep['dependencies'], $js_dep['version'], true );

		wp_localize_script(
			$handle,
			'zipwp_client_host',
			array(
				'rest_root'               => esc_url_raw( rest_url() ),
				'rest_nonce'              => wp_create_nonce( 'wp_rest' ),
				'ajax_url'                => esc_url_raw( admin_url( 'admin-ajax.php', 'relative' ) ),
				'activate_plugin_nonce'   => wp_create_nonce( 'zipwp-activate-plugin' ),
				'site_url'                => esc_url_raw( get_site_url() ),
				'migration_plugin_slug'   => 'wpvivid-backuprestore',
				'migration_plugin_file'   => 'wpvivid-backuprestore/wpvivid-backuprestore.php',
				'migration_plugin_name'   => 'WPvivid Backup & Migration Plugin',
				'migration_plugin_status' => $this->get_plugin_status( 'wpvivid-backuprestore/wpvivid-backuprestore.php' ),
				'export_url'              => admin_url( 'admin.php?page=WPvivid' ),
			)
		);

		wp_enqueue_style( $handle );
		wp_enqueue_script( $handle );
	}

	/**
	 * Add menu page.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function show_site_details() {

		if ( ! $this->allowed_screen_for_notices() || ! $this->is_show_notice() ) {
			return;
		}

		printf( '<div id="zipwp-client-notice"></div>' );
	}

	/**
	 * Check allowed screen for notices.
	 *
	 * @since 0.0.2
	 * @return bool
	 */
	public function allowed_screen_for_notices() {

		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen          = get_current_screen();
		$screen_id       = $screen ? $screen->id : '';
		$allowed_screens = array(
			'dashboard',
		);

		if ( in_array( $screen_id, $allowed_screens, true ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Check hide/show notice.
	 *
	 * @since 0.0.2
	 * @return bool
	 */
	public function is_show_notice() {
		if ( get_option( 'zipwp_guest_site' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Get Login Information
	 *
	 * @return array<mixed>
	 * @since 1.1.0
	 */
	public function get_login_information() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return [];
		}

		$visibility = 'hidden';

		/** Variable Declaration.
		 *
		 * @var array<mixed> $site_details
		 */
		$site_details = Helper::get_site_details();
		$username     = $site_details['username'];
		$password     = $site_details['password'];

		if ( empty( $username ) || empty( $password ) ) {
			return [];
		}

		return array(
			'heading'    => 'Login Credentials:',
			'details'    => array(
				array(
					'heading' => 'URL:',
					'value'   => admin_url(),
					'url'     => admin_url(),
				),
				array(
					'heading' => 'Username:',
					'value'   => $username,
				),
				array(
					'heading' => 'Password:',
					'value'   => $password,
				),
			),
			'cta'        => 'Copy to Clipboard',
			'visibility' => $visibility,
		);
	}

	/**
	 * Get Notice details
	 *
	 * @return array<mixed>
	 * @since 1.1.0
	 */
	public function get_timer_notice() {

		// If permanent site then don't show timer.
		if ( Helper::is_site_reserved() ) {
			return [];
		}

		// If the blueprint demo site then don't show popup.
		if ( Helper::get_blueprint_source() === 'demo' ) {
			return [];
		}

		$visibility = get_option( 'zipwp_close_timer_notice', false ) ? 'hidden' : 'visible';
		$guest_site = get_option( 'zipwp_guest_site', false );
		$plan       = get_option( 'zipwp_plan', false );

		// Guest Site and also check condition for plan.
		if ( $guest_site ) {
			$site_uuid = Helper::get_site_details( 'uuid' );

			if ( ! is_string( $site_uuid ) ) {
				$site_uuid = '';
			}

			$claim_site_url = 'https://app.zipwp.com/sites/claim/' . $site_uuid;
			return array(
				'heading'    => 'Need more time?',
				'content'    => 'This website was created on the ZipWP platform as a guest user. To enjoy extended access and additional benefits, we invite you to sign up and create a free account.
				<br><br>
				If you are already a user, log in to your account.',
				'cta'        => array(
					array(
						'text' => 'Create Free Account',
						'url'  => $claim_site_url . '?ask=register',
						'type' => 'primary brand',
					),
					array(
						'text' => 'Login to Your Account',
						'url'  => $claim_site_url . '?ask=login',
						'type' => 'secondary brand',
					),
				),
				'visibility' => $visibility,
			);
		}

		// Free user.
		if ( 'free' === $plan ) {
			return array(
				'heading'    => 'Need more time?',
				'content'    => 'You are currently using our Free plan. To ensure uninterrupted access to this site without any expiration, please upgrade your account.',
				'cta'        => array(
					array(
						'text' => 'See Upgrade Options',
						'url'  => 'https://app.zipwp.com/pricing?utm_source=zipwp-client-adminbar&utm_medium=more-time-upgrade-cta',
						'type' => 'primary brand',
					),
				),
				'visibility' => $visibility,
			);
		}

		// For all paid plans.
		return array(
			'heading'    => 'Need more time?',
			'content'    => 'Mark this site as permanent if you do not want it to expire.',
			'cta'        => array(
				array(
					'text' => 'Visit ZipWP Dashboard',
					'url'  => 'https://app.zipwp.com/sites',
					'type' => 'primary',
				),
			),
			'visibility' => $visibility,
		);
	}

	/**
	 * Load redirection scripts.
	 *
	 * @return void
	 * @since  0.0.5
	 */
	public function guest_timer_scripts() {

		// If user not logged in or not admin.
		if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$handle       = 'zipwp-guest-script';
		$js_deps_file = ZIPWP_CLIENT_BUILD_DIR . 'site-timer-details/main.asset.php';
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

		wp_register_style( $handle, ZIPWP_CLIENT_BUILD_URL . 'site-timer-details/style-main.css', [], ZIPWP_CLIENT_VER );
		wp_register_script( $handle, ZIPWP_CLIENT_BUILD_URL . 'site-timer-details/main.js', $js_dep['dependencies'], $js_dep['version'], true );

		/** Variable Declaration.
		 *
		 * @var array<mixed> $site_details
		 */
		$site_details = Helper::get_site_details();

		wp_localize_script(
			'zipwp-guest-script',
			'zipwp_guest',
			array(
				'expire_at'         => $site_details['expire_at'],
				'timer_notice'      => $this->get_timer_notice(),
				'login_information' => $this->get_login_information(),
				'rest_nonce'        => wp_create_nonce( 'wp_rest' ),
			)
		);

		wp_enqueue_style( 'zipwp-guest-script' );
		wp_enqueue_script( 'zipwp-guest-script' );
	}

	/**
	 * Load redirection scripts.
	 *
	 * @return void
	 * @since  0.0.5
	 */
	public function load_redirection_scripts() {

		if ( ! is_admin() || ! isset( $_GET['zipwp-redirect'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		$redirect_type = isset( $_GET['type'] ) ? sanitize_text_field( wp_unslash( $_GET['type'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( 'plugin' === $redirect_type ) {
			$active_plugins = get_option( 'active_plugins' );

			if ( ! $this->should_redirect_to_plugin_homepage( $active_plugins ) ) {
				return;
			}
		}

		wp_enqueue_script(
			'zipwp-redirection-app',
			ZIPWP_CLIENT_URL . 'inc/admin/assets/js/plugin-redirection.js',
			[],
			ZIPWP_CLIENT_VER,
			true
		);

		wp_localize_script(
			'zipwp-redirection-app',
			'zipwp_redirection',
			array(
				'plugins_page'     => admin_url( 'plugins.php' ),
				'themes_page'      => admin_url( 'themes.php' ),
				'redirection_type' => esc_js( $redirect_type ),
			)
		);
	}

	/**
	 * Check if we should redirect to plugin homepage.
	 *
	 * @param array<string,string> $plugins plugins data.
	 * @return bool
	 * @since  0.0.5
	 */
	public function should_redirect_to_plugin_homepage( $plugins ) {

		// Plugins which already have onboarding process. We don't want to redirect to plugin homepage.
		$plugins_with_onboarding = [
			'wpforms-lite/wpforms.php',
			'elementor/elementor.php',
			'woocommerce/woocommerce.php',
			'ultimate-addons-for-gutenberg/ultimate-addons-for-gutenberg.php',
			'wordpress-seo/wp-seo.php',
			'easy-digital-downloads/easy-digital-downloads.php',
		];

		if ( ! empty( $plugins ) ) {
			$plugin_exists = array_intersect( $plugins, $plugins_with_onboarding );

			if ( ! empty( $plugin_exists ) ) {
				return false;
			}
		}

		return true;
	}
}
