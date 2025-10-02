<?php
/**
 * Content Generation Controller
 *
 * Main module controller for handling content generation functionality.
 *
 * @package SureRank\Inc\Modules\Content_Generation
 * @since x.x.x
 */

namespace SureRank\Inc\Modules\Content_Generation;

use SureRank\Inc\Traits\Get_Instance;
use SureRank\Inc\Functions\Requests;
use SureRank\Inc\Modules\Ai_Auth\Controller as Ai_Auth_Controller;
use WP_Error;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Controller class
 *
 * Main module class for content generation functionality.
 */
class Controller {

	use Get_Instance;

	/**
	 * Credit System URL.
	 * 
	 * @var string
	 * @since x.x.x
	 */
	private $api_url = 'https://credits.startertemplates.com/api/';

	/**
	 * Get API URL.
	 * 
	 * @return string API URL.
	 * @since x.x.x
	 */
	public function get_api_url() {
		if ( ! defined( 'SURERANK_CREDIT_SERVER_API' ) ) {
			define( 'SURERANK_CREDIT_SERVER_API', $this->api_url );
		}

		return SURERANK_CREDIT_SERVER_API;
	}

	/**
	 * Generate Content for a given post.
	 * 
	 * @param array<string,string> $inputs Inputs for content generation.
	 * @param string               $type Type of content to generate (e.g., 'page_title').
	 * 
	 * @return string|WP_Error Generated content string or error object.
	 * @since x.x.x
	 */
	public function generate_content( $inputs, $type = 'page_title' ) {
		$inputs = wp_parse_args(
			$inputs,
			[
				'page_title'   => '',
				'site_tagline' => '',
				'site_name'    => '',
			] 
		);

		$args = [
			'type'       => $type,
			'inputs'     => $inputs,
			'source'     => 'openai',
			'auth_token' => '12yuBN6e4Xnn13dK',
		];

		$response = $this->send_api_request( $args );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$response_body    = wp_remote_retrieve_body( $response );
		$decoded_response = json_decode( $response_body, true );


		if ( ! is_array( $decoded_response ) ) {
			return new WP_Error( 'content_generation_error', __( 'Failed to generate content.', 'surerank' ) );
		}

		if ( isset( $decoded_response['code'] ) ) {
			$code = $decoded_response['code'];
			/* translators: %s is response code */
			$message = isset( $decoded_response['message'] ) ? $decoded_response['message'] : sprintf( __( 'Failed to generate content with error code %s.', 'surerank' ), $code );

			return new WP_Error( $code, $message );
		}

		if ( ! isset( $decoded_response['content'] ) ) {
			return new WP_Error( 'content_generation_error', __( 'Failed to generate content.', 'surerank' ) );
		}

		return $decoded_response['content'];
	}

	/**
	 * Send API request to content generation service.
	 *
	 * @since x.x.x
	 * @param array<string, mixed> $request_data Request data.
	 * @return array<string, mixed>|WP_Error API response.
	 */
	private function send_api_request( $request_data ) {
		$auth_token = apply_filters(
			'surerank_content_generation_auth_token',
			Ai_Auth_Controller::get_instance()->get_auth_data( 'user_email' )
		);

		$url = $this->get_api_url() . 'surerank/generate/content';

		$response = Requests::post(
			$url,
			[
				'headers' => array(
					'X-Token'      => base64_encode( $auth_token ),
					'Content-Type' => 'application/json; charset=utf-8',
				),
				'body'    => wp_json_encode( $request_data ),
				'timeout' => 5, // phpcs:ignore WordPressVIPMinimum.Performance.RemoteRequestTimeout.timeout_timeout
			] 
		);

		return $response;
	}
}
