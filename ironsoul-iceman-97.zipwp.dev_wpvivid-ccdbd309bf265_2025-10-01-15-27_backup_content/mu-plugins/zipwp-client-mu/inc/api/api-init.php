<?php
/**
 * INitialize API.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Api;

use ZIPWP_CLIENT\Inc\Traits\Instance;

/**
 * Api_Base
 *
 * @since 1.1.0
 */
class ApiInit {

	use Instance;

	/**
	 * Controller object.
	 *
	 * @var object class.
	 */
	public $controller = null;

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {

		// REST API extensions init.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register API routes.
	 *
	 * @since 0.0.2
	 * @return void
	 */
	public function register_routes() {

		$controllers = array(
			'\ZIPWP_CLIENT\Inc\Api\Customizer',
			'\ZIPWP_CLIENT\Inc\Api\Exporter',
			'\ZIPWP_CLIENT\Inc\Api\Notice',
		);

		foreach ( $controllers as $controller ) {

			$this->controller = $controller::instance();

			$this->controller->register_routes();
		}
	}
}
