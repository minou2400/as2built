<?php
/**
 * Content Generation Utils
 *
 * Utils module class for handling content generation functionality.
 *
 * @package SureRank\Inc\Modules\Content_Generation
 * @since x.x.x
 */

namespace SureRank\Inc\Modules\Content_Generation;

use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Utils class
 *
 * Main module class for content generation functionality.
 */
class Utils {

	use Get_Instance;

	/**
	 * Get API types.
	 * 
	 * @return array<int,string> Array of API types.
	 * @since x.x.x
	 */
	public function get_api_types() {
		return apply_filters(
			'surerank_content_generation_types',
			[
				'page_title',
				'home_page_title',
				'page_description',
				'home_page_description',
				'social_title',
				'social_description',
				'site_tag_line',
				'page_url_slug',
			]
		);
	}

}
