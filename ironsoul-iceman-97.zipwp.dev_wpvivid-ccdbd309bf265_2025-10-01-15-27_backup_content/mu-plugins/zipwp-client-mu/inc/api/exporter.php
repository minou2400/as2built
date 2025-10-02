<?php
/**
 * Exporter API.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Api;

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use ZIPWP_CLIENT\Inc\Traits\Instance;
use ZIPWP_CLIENT\Inc\Api\Api_Base;
use ZIPWP_CLIENT\Inc\Admin\Helper;

/**
 * Exporter
 *
 * @since 1.1.0
 */
class Exporter extends Api_Base {

	use Instance;

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = '/exporter/';

	/**
	 * Init Hooks.
	 *
	 * @since 1.1.0
	 * @return void
	 */
	public function register_routes() {

		$namespace = $this->get_api_namespace();

		register_rest_route(
			$namespace,
			$this->rest_base . 'export',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE, // GET.
					'callback'            => array( $this, 'export_site_data' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(
						'uuid' => array(
							'validate_callback' => function( $param, $request, $key ) {
								return is_string( $param );
							},
						),
					),
				),
			)
		);
	}

	/**
	 * Check whether a given request has permission to read notes.
	 *
	 * @param  object $request WP_REST_Request Full details about the request.
	 * @return object|boolean
	 */
	public function get_item_permissions_check( $request ) {

		// To do: Check api token or JWT token for permission.
		return true;
	}

	/**
	 * Set site related data.
	 *
	 * @since 1.1.0
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response
	 */
	public function export_site_data( $request ) {
		$uuid         = $request->get_param( 'uuid' );
		$current_uuid = Helper::get_site_details( 'uuid' );

		if ( $uuid !== $current_uuid ) {
			$response = new \WP_REST_Response(
				new \WP_Error( 'site_validation_failed', __( 'Site validation failed.', 'zipwp-client' ) )
			);
			$response->set_status( 500 );
			return $response;
		}

		$export_data = get_option( 'zipwp_client_export_data', [] );

		$response = new \WP_REST_Response( $export_data );
		$response->set_status( 200 );

		return $response;
	}
}
