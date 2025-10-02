<?php
/**
 * Utility class for fixing SEO Checks functionality.
 *
 * @package SureRank\Inc\Modules\FixSeoChecks
 * @since x.x.x
 */

namespace SureRank\Inc\Modules\FixSeoChecks;

use SureRank\Inc\Traits\Get_Instance;
use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Utility class for fixing SEO Checks functionality.
 *
 * @package SureRank\Inc\Modules\FixSeoChecks
 * @since x.x.x
 */
class Utils {


	use Get_Instance;

	/**
	 * Send response array or WP_Error based on status.
	 *
	 * @param bool   $status  Response status.
	 * @param string $message Response message.
	 * @param string $type    Response type.
	 * @return array{status: bool, message: string, type: string}|WP_Error Response array or WP_Error object.
	 * @since x.x.x
	 */
	public function send_response( bool $status, string $message, string $type ) {
		if ( ! $status ) {
			return new WP_Error(
				'seo_fix_failed',
				$message,
				[
					'status' => 500,
					'type'   => $type,
				]
			);
		}

		return [
			'status'  => $status,
			'message' => $message,
			'type'    => $type,
		];
	}

	/**
	 * Create a "use me" method name from the input key.
	 *
	 * @param string $input_key The input key.
	 * @return string The "use me" method name.
	 */
	public static function create_use_me_method( string $input_key ): string {
		return 'use_' . $input_key;
	}

	/**
	 * Get classes that implement "use me" methods.
	 *
	 * @return array<int,string> Array of class names.
	 * @since x.x.x
	 */
	public static function get_use_classes(): array {
		return apply_filters(
			'surerank_page_check_use_me_classes',
			[
				'SureRank\Inc\Modules\FixSeoChecks\Page',
			]
		);
	}

}
