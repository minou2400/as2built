<?php
/**
 * Create site.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc;

use ZIPWP_CLIENT\Inc\Traits\Instance;
use ZIPWP_CLIENT\Inc\Admin\Helper;

/**
 * Updater
 *
 * @since 1.1.0
 */
class Updater {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {

		// Update site details from ZipWP.
		add_action( 'init', array( $this, 'update_site_details' ) );

		// Update the plugin only on admin side visit.
		add_action( 'admin_init', array( $this, 'scheduled_updates' ) );
	}

	/**
	 * Run scheduled job for Plugin updates.
	 *
	 * @since 1.2.2
	 * @return void
	 */
	public function scheduled_updates() {
		// If installing or doing ajax, return.
		if ( wp_installing() || wp_doing_ajax() ) {
			return;
		}

		// If another process is running; exit early.
		$update_lock = get_option( 'zipwp_client_update_lock', false );

		if ( $update_lock && ( time() - $update_lock < 60 * MINUTE_IN_SECONDS ) ) {
			return;
		}

		// Get last update check time.
		$last_update_time = get_option( 'zipwp_client_last_update', 0 );

		// Run the job only if 24 hours have passed since the last check.
		if ( time() - $last_update_time < DAY_IN_SECONDS ) {
			return;
		}

		// Set next update check time.
		update_option( 'zipwp_client_last_update', time() );

		try {
			// Set the lock with the current timestamp.
			update_option( 'zipwp_client_update_lock', time() );

			// Start the update check.
			$this->check_updates();
		} finally {
			// Clear the lock by deleting the option.
			delete_option( 'zipwp_client_update_lock' );
		}
	}

	/**
	 * Get Updates
	 *
	 * @return void
	 */
	public function check_updates() {
		$api = Helper::get_api_base_url() . '/sites/wp/plugins/zipwp-client/';

		$response = wp_remote_get(
			$api,
			array(
				'headers' => array(
					'Accept'       => 'application/json',
					'Content-Type' => 'application/json',
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return;
		}

		$code = wp_remote_retrieve_response_code( $response );

		if ( 200 !== $code ) {
			return;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );

		$server_plugin_version = $data['version'] ?? '1.0.0';

		if ( version_compare( $server_plugin_version, ZIPWP_CLIENT_VER, '>' ) && ! empty( $data['download_url'] ) ) {
			// Update available.
			$this->perform_update( $data['download_url'] );
		}
	}

	/**
	 * Perform Update
	 *
	 * @param string $download_url Download URL.
	 * @return void
	 */
	public function perform_update( $download_url ) {

		if ( ! class_exists( 'WP_Filesystem_Direct' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php';
			require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-direct.php';
		}

		// Initialize the WordPress filesystem.
		WP_Filesystem();
		/* $wp_filesystem = new WP_Filesystem_Direct( false ); Not needed for now. */ //phpcs:ignore

		$temp_file = download_url( $download_url );

		if ( is_wp_error( $temp_file ) ) {
			return;
		}

		$plugin_dir = WP_CONTENT_DIR . '/mu-plugins/';
		$result     = unzip_file( $temp_file, $plugin_dir );

		if ( is_wp_error( $result ) ) {
			return;
		}

		// Clean up temporary file.
		unlink( $temp_file );
	}

	/**
	 * Update site details.
	 *
	 * @return void
	 */
	public function update_site_details() {

		if ( ! is_user_logged_in() || ! is_admin() || wp_doing_ajax() ) {
			return;
		}

		$reset_time = get_option( 'zipwp_data_reset_time', false );

		if ( $reset_time && time() < $reset_time ) {
			return;
		}

		$app_url         = Helper::get_app_url();
		$site_uuid       = Helper::get_site_uuid();
		$site_auth_token = Helper::get_site_auth_token();

		if ( empty( $app_url ) || empty( $site_uuid ) || empty( $site_auth_token ) ) {
			return;
		}

		// Get site details.
		$response = wp_remote_get(
			$app_url . '/api/wp-site-data/' . $site_uuid . '?site_auth_token=' . $site_auth_token,
			[
				'headers' => [
					'Accept' => 'application/json',
				],
			]
		);

		// Set 1 hour as reset time.
		$reset_time = time() + HOUR_IN_SECONDS;
		update_option( 'zipwp_data_reset_time', $reset_time );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return;
		}

		// Get response body.
		$body = wp_remote_retrieve_body( $response );

		// Decode json.
		$body = json_decode( $body, true );

		if ( ! is_array( $body ) ) {
			return;
		}

		foreach ( $body as $key => $value ) {

			$prev_value = get_option( $key, false );
			$new_value  = $value;

			if ( is_array( $value ) && is_array( $prev_value ) ) {
				$new_value = wp_parse_args( $value, $prev_value );
			}

			update_option( $key, $new_value );
		}
	}
}
