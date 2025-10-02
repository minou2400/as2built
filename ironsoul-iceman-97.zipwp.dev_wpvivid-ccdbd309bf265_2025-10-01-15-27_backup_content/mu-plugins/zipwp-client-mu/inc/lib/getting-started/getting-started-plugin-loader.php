<?php
/**
 * Plugin Loader.
 *
 * @package getting-started
 * @since 1.0.0
 */

namespace GS;

/**
 * Getting_Started_Plugin_Loader
 *
 * @since 1.0.0
 */
class Getting_Started_Plugin_Loader {

	/**
	 * Instance
	 *
	 * @access private
	 * @var object Class Instance.
	 * @since 1.0.0
	 */
	private static $instance = null;

	/**
	 * Initiator
	 *
	 * @since 1.0.0
	 * @return object initialized object of class.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Autoload classes.
	 *
	 * @param string $class class name.
	 *
	 * @return void
	 */
	public function autoload( $class ) {
		if ( 0 !== strpos( $class, __NAMESPACE__ ) ) {
			return;
		}

		$class_to_load = $class;

		$filename = strtolower(
			(string) preg_replace(
				[ '/^' . __NAMESPACE__ . '\\\/', '/([a-z])([A-Z])/', '/_/', '/\\\/' ],
				[ '', '$1-$2', '-', DIRECTORY_SEPARATOR ],
				$class_to_load
			)
		);

		$file = GS_DIR . $filename . '.php';

		// if the file redable, include it.
		if ( is_readable( $file ) ) {
			require_once $file;
		}
	}

	/**
	 * Constructor
	 *
	 * @since 1.0.0
	 */
	public function __construct() {

		spl_autoload_register( [ $this, 'autoload' ] );

		add_action( 'wp_loaded', [ $this, 'load_files' ] );
	}

	/**
	 * Load the main plugin files.
	 *
	 * @return void
	 */
	public function load_files() {
		require_once GS_DIR . 'classes/class-gs-helper.php';
		require_once GS_DIR . 'classes/class-gs-admin.php';
		require_once GS_DIR . 'classes/class-gs-api.php';
	}
}

/**
 * Kicking this off by calling 'get_instance()' method
 */
Getting_Started_Plugin_Loader::get_instance();
