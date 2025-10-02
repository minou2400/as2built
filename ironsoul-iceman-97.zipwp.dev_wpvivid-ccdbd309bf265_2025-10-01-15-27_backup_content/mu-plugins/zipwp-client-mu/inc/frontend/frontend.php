<?php
/**
 * Frontend functionality of the plugin.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Frontend;

use ZIPWP_CLIENT\Inc\Traits\Instance;


/**
 * Dashboard
 *
 * @since 1.1.0
 */
class Frontend {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {

		add_action( 'wp_footer', [ $this, 'display_powered_by_text' ] );
	}

	/**
	 * Display the Powered by text.
	 *
	 * @return void
	 */
	public function display_powered_by_text() {
		$user_plan = get_option( 'zipwp_plan', 'free' );

		/**
		 * If the user is not a premium user, then do not display branding.
		 */
		if ( 'free' !== $user_plan ) {
			return;
		}

		?>
		<style>
			.zipwp-portal-branding {
				position: fixed;
				right: 35px;
				bottom: 25px;
				padding: 10px 15px;
				margin: 0;
				color: black;
				background: #F0F0FF;
				text-decoration: none;
				border-radius: 9999px;
				border: 1px solid #E2E8F0;
				font-size: 14px;
				line-height: 1;
				font-weight: 500;
				z-index: 9999;
				box-shadow: 0 0 #0000, 0 0 #0000, 0 4px 6px -1px rgba( 0, 0, 0, 0.1 ), 0 2px 4px -1px rgba( 0, 0, 0, 0.06 );
			}
		</style>
		<a target="_blank" href="https://app.zipwp.com/pricing?utm_source=zipwp-client-branding&utm_medium=branding-cta" class="zipwp-portal-branding">
			Powered by ZipWP
		</a>
		<?php
	}

}
