<?php
/**
 * Site Progress.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Admin;

use ZIPWP_CLIENT\Inc\Traits\Instance;

/**
 * Trait Instance.
 */
class SiteProgress {

	use Instance;

	/**
	 * Constructor
	 *
	 * @since 0.0.2
	 */
	public function __construct() {
		add_action( 'wp', array( $this, 'maybe_site_wip' ) );
	}

	/**
	 * Callback function to verify site if under WIP.
	 *
	 * @return void
	 */
	public function maybe_site_wip() {

		if ( get_option( 'zipwp_ai_migration', 'no' ) === 'no' ) {
			return;
		}

		?>
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Coming Soon</title>
				<style>
				html {
					margin: 0;
					padding: 0;
				}
				body {
					font-family: Manrope, sans-serif;
					text-align: center;
					margin: 0;
					padding: 0;
					background-color: #f5f5f5;
					display: flex;
					align-items: center;
					justify-content: center;
					min-height: 100vh;
					overflow: hidden;
				}
				h1 {
					margin-top: 20px;
					margin-bottom: 10px;
				}
				p {
					line-height: 1;
				}
				.zipwp-container {
					background-color: #ffffff;
					padding: 25px; /* Adjust the padding to reduce container height */
					border-radius: 10px;
					box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
					width: 100%;
					max-width: 800px;
				}
				</style>
			</head>
			<body>
				<div class="zipwp-container">
				<h1>Get Ready for Something Amazing!</h1>
				<p>We’re currently crafting your brand new website. Stay tuned for your new website!</p>
				</div>
			</body>
		</html>
		<?php
		exit;
	}
}

