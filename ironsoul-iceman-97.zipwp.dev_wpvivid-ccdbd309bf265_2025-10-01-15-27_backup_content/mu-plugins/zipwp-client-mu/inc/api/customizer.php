<?php
/**
 * Customizer API.
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
 * Customizer
 *
 * @since 1.1.0
 */
class Customizer extends Api_Base {

	use Instance;

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base = '/customize/';

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
			$this->rest_base . 'save',
			array(
				'args' => array(
					'logo'       => array(
						'description' => __( 'Logo.', 'zipwp-client' ),
						'type'        => 'string',
					),
					'typography' => array(
						'description' => __( 'Typographt', 'zipwp-client' ),
						'type'        => 'string',
					),
					'colors'     => array(
						'description' => __( 'Colors', 'zipwp-client' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE, // CREATABLE.
					'callback'            => array( $this, 'set_site_data' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
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
	 * Set site related data.
	 *
	 * @since 1.1.0
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return \WP_REST_Response
	 */
	public function set_site_data( $request ) {
		if ( ! function_exists( 'astra_get_option' ) ) {
			$response = new \WP_REST_Response( array( 'success' => false ) );
			$response->set_status( 500 );

			return $response;
		}

		/** Variable Declaration
		 *
		 * @var string colors
		 * @var string $logo
		 */

		$colors     = $request->get_param( 'colors' );
		$typography = $request->get_param( 'typography' );
		$logo       = $request->get_param( 'logo' );
		$show_title = $request->get_param( 'showTitle' );

		if ( class_exists( 'Astra_Global_Palette' ) && is_callable( array( new \Astra_Global_Palette(), 'get_default_color_palette' ) ) ) {
			/** Variable Declaration
			 *
			 * @var array<array<string>> $palette
			 */
			$palette = ! empty( $colors ) && is_string( $colors ) ? json_decode( stripslashes( $colors ), true ) : array();
			$colors  = isset( $palette['colors'] ) ? (array) $palette['colors'] : array();
			if ( ! empty( $colors ) ) {
				$global_palette = astra_get_option( 'global-color-palette' );
				$color_palettes = get_option( 'astra-color-palettes', \Astra_Global_Palette::get_default_color_palette() );

				foreach ( $colors as $key => $color ) {
					$global_palette['palette'][ $key ] = $color;
					/** Variable Declaration
					 *
					 * @var array<array<string>> $color_palettes
					 */
					$color_palettes['palettes']['palette_1'][ $key ] = $color;
				}

				update_option( 'astra-color-palettes', $color_palettes );
				astra_update_option( 'global-color-palette', $global_palette );
			}
		}

		if ( isset( $typography ) ) {
			/** Variable Declaration
			 *
			 * @var array<array<string>> $typography
			 */
			$typography     = is_string( $typography ) ? json_decode( stripslashes( $typography ), true ) : array();
			$font_size_body = isset( $typography['font-size-body'] ) ? (array) $typography['font-size-body'] : '';
			if ( ! empty( $font_size_body ) && is_array( $font_size_body ) ) {
				astra_update_option( 'font-size-body', $font_size_body );
			}

			if ( ! empty( $typography['body-font-family'] ) ) {
				astra_update_option( 'body-font-family', $typography['body-font-family'] );
			}

			if ( ! empty( $typography['body-font-variant'] ) ) {
				astra_update_option( 'body-font-variant', $typography['body-font-variant'] );
			}

			if ( ! empty( $typography['body-font-weight'] ) ) {
				astra_update_option( 'body-font-weight', $typography['body-font-weight'] );
			}

			if ( ! empty( $typography['body-line-height'] ) ) {
				astra_update_option( 'body-line-height', $typography['body-line-height'] );
			}

			if ( ! empty( $typography['headings-font-family'] ) ) {
				astra_update_option( 'headings-font-family', $typography['headings-font-family'] );
			}

			if ( ! empty( $typography['headings-font-weight'] ) ) {
				astra_update_option( 'headings-font-weight', $typography['headings-font-weight'] );
			}

			if ( ! empty( $typography['headings-line-height'] ) ) {
				astra_update_option( 'headings-line-height', $typography['headings-line-height'] );
			}

			if ( ! empty( $typography['headings-font-variant'] ) ) {
				astra_update_option( 'headings-font-variant', $typography['headings-font-variant'] );
			}
		}

		if ( isset( $logo ) ) {
			/** Variable Declaration
			 *
			 * @var array<string> $logo
			 */
			$logo    = is_string( $logo ) ? json_decode( stripslashes( $logo ), true ) : array();
			$logo_id = isset( $logo['logo'] ) ? absint( $logo['logo'] ) : '';

			if ( ! empty( $logo_id ) ) {
				$width_index = 'ast-header-responsive-logo-width';
				set_theme_mod( 'custom_logo', $logo_id );
				// Disable site title when logo is set.
				astra_update_option( 'display-site-title', false );
				// Set logo width.
				$logo_width = isset( $logo['width'] ) ? sanitize_text_field( $logo['width'] ) : '';
				$option     = astra_get_option( $width_index );

				if ( isset( $option['desktop'] ) ) {
					$option['desktop'] = $logo_width;
				}
				astra_update_option( $width_index, $option );

				// Check if transparent header is used in the demo.
				$transparent_header = astra_get_option( 'transparent-header-logo', false );
				$inherit_desk_logo  = astra_get_option( 'different-transparent-logo', false );

				if ( '' !== $transparent_header && $inherit_desk_logo ) {
					astra_update_option( 'transparent-header-logo', wp_get_attachment_url( $logo_id ) );
					$width_index = 'transparent-header-logo-width';
					$option      = astra_get_option( $width_index );

					if ( isset( $option['desktop'] ) ) {
						$option['desktop'] = $logo_width;
					}
					astra_update_option( $width_index, $option );
				}
			}
		}

		if ( isset( $show_title ) ) {
			$show_title = $show_title ? 1 : 0;
			astra_update_option(
				'display-site-title-responsive',
				array(
					'desktop' => $show_title,
					'tablet'  => $show_title,
					'mobile'  => $show_title,
				)
			);
		}

		$response = new \WP_REST_Response( array( 'success' => true ) );
		$response->set_status( 200 );

		return $response;
	}
}
