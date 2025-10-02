<?php
/**
 * Sitemap API class
 *
 * Handles sitemap cache generation related REST API endpoints for the SureRank plugin.
 *
 * @package SureRank\Inc\API
 */

namespace SureRank\Inc\API;

use SureRank\Inc\Functions\Cron;
use SureRank\Inc\Functions\Send_Json;
use SureRank\Inc\Traits\Get_Instance;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Class Sitemap
 *
 * Handles sitemap cache generation related REST API endpoints.
 */
class Sitemap extends Api_Base {
	use Get_Instance;

	/**
	 * Route for generating sitemap cache
	 */
	protected const GENERATE_CACHE = '/sitemap/generate-cache';

	/**
	 * Register API routes.
	 *
	 * @since 1.2.0
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->get_api_namespace(),
			self::GENERATE_CACHE,
			[
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => [ $this, 'generate_cache' ],
				'permission_callback' => [ $this, 'validate_permission' ],
			]
		);
	}

	/**
	 * Generate sitemap cache.
	 *
	 * @param WP_REST_Request<array<string, mixed>> $request REST API request object.
	 * @since 1.2.0
	 * @return void
	 */
	public function generate_cache( $request ) {
		try {

			wp_schedule_single_event( time() + 10, Cron::SITEMAP_CRON_EVENT, [ 'yes' ] );

			Send_Json::success(
				[
					'message'     => __( 'Sitemap cache generation has started.', 'surerank' ),
					'description' => __( 'This may take up to 5 minutes, please wait before checking the sitemap.', 'surerank' ),
				]
			);

		} catch ( \Exception $e ) {
			Send_Json::error(
				[
					'message' => sprintf(
							/* translators: %s: Error message */
						__( 'Failed to start cache generation: %s', 'surerank' ),
						$e->getMessage()
					),
				]
			);
		}
	}
}
