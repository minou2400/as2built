<?php
/**
 * Set constants
 *
 * @package zipwp-client
 */

define( 'ZIPWP_CLIENT_FILE', __FILE__ );
define( 'ZIPWP_CLIENT_BASE', plugin_basename( ZIPWP_CLIENT_FILE ) );
define( 'ZIPWP_CLIENT_SLUG', basename( dirname( ZIPWP_CLIENT_FILE ) ) );
define( 'ZIPWP_CLIENT_DIR', plugin_dir_path( ZIPWP_CLIENT_FILE ) );
define( 'ZIPWP_CLIENT_URL', plugins_url( '/', ZIPWP_CLIENT_FILE ) );
define( 'ZIPWP_CLIENT_BUILD_DIR', ZIPWP_CLIENT_DIR . 'assets/build/' );
define( 'ZIPWP_CLIENT_BUILD_URL', ZIPWP_CLIENT_URL . 'assets/build/' );
define( 'ZIPWP_CLIENT_VER', '1.3.0' );

if ( ! defined( 'ZIPWP_CLIENT_ZIPWP_API' ) ) {
	define( 'ZIPWP_CLIENT_ZIPWP_API', 'https://api.zipwp.com/api' );
}

require_once 'zipwp-client-plugin-loader.php';
