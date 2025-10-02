<?php
/**
 * Trait.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Traits;

/**
 * Trait Instance.
 */
trait Instance {

	/**
	 * Instance object.
	 *
	 * @var self Class Instance.
	 */
	private static $instance = null;

	/**
	 * Initiator
	 *
	 * @since 1.1.0
	 * @return self Initialized object of class.
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
}

