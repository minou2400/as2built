<?php
/**
 * Site Protection.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Admin;

use ZIPWP_CLIENT\Inc\Traits\Instance;

/**
 * Trait Instance.
 */
class Helper {

	use Instance;

	/**
	 * Get Site data.
	 *
	 * @since 1.1.0
	 * @param string $key options name.
	 * @return array<string,string>|string Array for business details or single detail in a string.
	 */
	public static function get_site_details( $key = '' ) {

		$default_details = [
			'uuid'         => '',
			'username'     => '',
			'password'     => '',
			'expire_at'    => '',
			'reserve'      => false,
			'color_scheme' => 'light',
			'site_type'    => 'blank',
		];

		$details = get_option( 'zipwp_site_data', [] );

		// Merge with default details.
		/** Variable Declaration
		 *
		 * @var array<mixed> $details
		 */
		$details = wp_parse_args( $details, $default_details );

		// Set default app url.
		if ( empty( $details['app_url'] ) ) {
			$details['app_url'] = 'https://api.zipwp.com';
		}

		if ( ! empty( $key ) ) {
			return $details[ $key ] ?? '';
		}

		return $details;
	}

	/**
	 * Get App Url.
	 *
	 * @return string
	 */
	public static function get_app_url() {

		$details = self::get_site_details();

		return $details['app_url'] ?? '';
	}

	/**
	 * Get API Base Url.
	 *
	 * @return string
	 */
	public static function get_api_base_url() {

		$api_base = ZIPWP_CLIENT_ZIPWP_API;

		return apply_filters( 'zipwp_client_api_base_url', $api_base );
	}

	/**
	 * Get Site UUID.
	 *
	 * @return string
	 */
	public static function get_site_uuid() {

		$uuid = get_option( 'zipwp_site_uuid', '' );

		if ( empty( $uuid ) ) {
			$details = self::get_site_details();
			$uuid    = $details['uuid'] ?? '';
		}

		return $uuid;
	}

	/**
	 * Get Site auth token.
	 *
	 * @return string
	 */
	public static function get_site_auth_token() {
		return get_option( 'zipwp_site_auth_token', '' );
	}

	/**
	 * Check if reserved site
	 *
	 * @return bool
	 */
	public static function is_site_reserved() {

		$reserved = self::get_site_details( 'reserve' );

		if ( $reserved ) {
			return true;
		}

		return false;
	}

	/**
	 * Get blueprint source.
	 *
	 * @return string
	 */
	public static function get_blueprint_source() {
		$details = self::get_site_details();

		return $details['blueprint_source'] ?? '';
	}

	/**
	 * Get cloud plan data.
	 *
	 * @return string
	 */
	public static function get_cloud_plan_slug() {
		$details = get_option( 'zipwp_cloud_plan_data', [] );
		return $details['plan_slug'] ?? '';
	}
}

