<?php
/**
 * API base.
 *
 * @package {{package}}
 * @since 1.1.0
 */

namespace ZIPWP_CLIENT\Inc\Api;

/**
 * Api_Base
 *
 * @since 1.1.0
 */
abstract class Api_Base extends \WP_REST_Controller {

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'zipwp-client/v1';

	/**
	 * Constructor
	 *
	 * @since 1.1.0
	 */
	public function __construct() {
	}

	/**
	 * Get API namespace.
	 *
	 * @since 1.1.0
	 * @return string
	 */
	public function get_api_namespace() {

		return $this->namespace;
	}
}
