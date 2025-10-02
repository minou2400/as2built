<?php
/**
 * Notices API.
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

/**
 * Exporter
 *
 * @since 1.1.0
 */
class Notice extends Api_Base {

	use Instance;

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = '/notice/';

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
			$this->rest_base . 'close-timer-notice',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE, // GET.
					'callback'            => array( $this, 'close_notice' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'args'                => array(),
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

		if ( ! current_user_can( 'manage_options' ) ) {
			return new \WP_Error(
				'zip_rest_cannot_access',
				__( 'Sorry, you are not authorize to access this resource.', 'zipwp-client' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}

	/**
	 * Close information notice.
	 *
	 * @since 1.1.0
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response
	 */
	public function close_notice( $request ) {

		update_option( 'zipwp_close_timer_notice', true );

		$response = new \WP_REST_Response( true );
		$response->set_status( 200 );

		return $response;
	}
}
