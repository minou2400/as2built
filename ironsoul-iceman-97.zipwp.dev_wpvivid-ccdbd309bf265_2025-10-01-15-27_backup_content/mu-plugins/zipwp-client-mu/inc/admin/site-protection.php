<?php
/**
 * Site Protection.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Admin;

use ZIPWP_CLIENT\Inc\Traits\Instance;
use ZIPWP_CLIENT\Inc\Admin\Helper;

/**
 * Trait Instance.
 */
class SiteProtection {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 0.0.2
	 */
	public function __construct() {
		add_action( 'template_redirect', array( $this, 'restrict_entire_site' ) );
		add_action( 'wp_ajax_nopriv_zipwp_site_protection_call', array( $this, 'verify_site_callback' ) );
		add_filter(
			'surerank_scraper_headers',
			function( $headers ) {
				return array_merge(
					$headers,
					[
						'headers' => [
							'Cookie' => 'zipwp_access=' . wp_generate_password( 12, false ),
						],
					]
				);
			}
		);
	}

	/**
	 * Callback function to verify site.
	 *
	 * @return void
	 */
	public function verify_site_callback() {

		check_ajax_referer( 'site_protection_nonce', 'nonce' );

		$access_key = wp_generate_password( 12, false );

		/**
		 * Variable Declaration.
		 *
		 * @var string $access_key.
		 */
		setcookie( 'zipwp_access', $access_key, time() + ( 8 * 24 * 60 * 60 ), '/' );

		wp_send_json_success();
	}

	/**
	 * Callback function to validate keys.
	 *
	 * @return boolean
	 */
	public function validate_keys() {

		if ( isset( $_COOKIE['zipwp_access'] ) ) {
			return true;
		}
		return false;
	}



	/**
	 * Callback function to restrict access to the entire site.
	 *
	 * @todo: Add scripts using wp hook.
	 *
	 * @return void
	 */
	public function restrict_entire_site() {

		if ( is_user_logged_in() ) {
			return;
		}

		$user_plan = get_option( 'zipwp_plan', 'free' );

		// Show gate if user plan is on free plan or no plan.
		if ( ! empty( $user_plan ) && 'free' !== $user_plan ) {
			return;
		}

		if ( $this->validate_keys() ) {
			return;
		}

		$nonce = wp_create_nonce( 'site_protection_nonce' );

		//phpcs:disable WordPress.WP.EnqueuedResources
		?>

		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Temporary Website</title>
				<link rel="stylesheet" href="<?php echo esc_url( ZIPWP_CLIENT_URL . 'inc/admin/assets/css/site-protection.css' ); ?>">
			</head>
			<body>
				<div class="zipwp-container">
					<div class="zipwp-row">
						<div class="zipwp-content">
							<div class="zipwp-login-container">
								<div class="zipwp-inner-container">
									<div class="zipwp-row">
										<div class="zipwp-content-wrap">
											<img alt="lock" src="<?php echo esc_url( ZIPWP_CLIENT_URL . 'inc/admin/assets/images/lock-icon.svg' ); ?>" class="zipwp-password-icon">
											<h2 class="zipwp-heading">This website is temporary and not intended for live traffic usage.</h3>
											<p class="zipwp-text">To proceed, kindly type <b>“ok”</b> in the box below.</p>
											<form class="zipwp-submit-form" id="zipwp-submit-form">
												<input id="zipwp-input" type="text" placeholder="Enter ok" required="" autofocus="" class="zipwp-form-control">
												<p class="zipwp-error-message">The text you entered does not match "ok" Please try again.</p>
												<button type="submit"  class="zipwp-btn zipwp-submit-btn">Submit</button>
												<p class="zipwp-footer-text">Powered by <a target="_blank" href="https://zipwp.com/">ZipWP</a></p>
											</form>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="zipwp-image"></div>
					</div>
				</div>
				<input type="hidden" name="zipwp_site_protection_nonce" value="<?php echo esc_attr( $nonce ); ?>">
				<div id="zipwp-data" data-url="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>"></div>
				<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
				<script src="<?php echo esc_url( ZIPWP_CLIENT_URL . 'inc/admin/assets/js/site-protection.js' ); ?>"></script>
			</body>
		</html>
		<?php
		exit;
	}
}

