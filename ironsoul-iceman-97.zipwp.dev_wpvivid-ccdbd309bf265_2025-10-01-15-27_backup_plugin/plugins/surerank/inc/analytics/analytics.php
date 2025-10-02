<?php
/**
 * Analytics class helps to connect BSFAnalytics.
 *
 * @package surerank.
 */

namespace SureRank\Inc\Analytics;

use SureRank\Inc\Functions\Get;
use SureRank\Inc\Functions\Settings;
use SureRank\Inc\GoogleSearchConsole\Controller;
use SureRank\Inc\Traits\Get_Instance;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
/**
 * Analytics class.
 *
 * @since 1.4.0
 */
class Analytics {
	use Get_Instance;

	/**
	 * Class constructor.
	 *
	 * @return void
	 * @since 1.4.0
	 */
	public function __construct() {

		if ( ! class_exists( 'Astra_Notices' ) ) {
			require_once SURERANK_DIR . 'inc/lib/astra-notices/class-astra-notices.php';
		}

		/*
		* BSF Analytics.
		*/
		if ( ! class_exists( 'BSF_Analytics_Loader' ) ) {
			require_once SURERANK_DIR . 'inc/lib/bsf-analytics/class-bsf-analytics-loader.php';
		}

		if ( ! class_exists( 'BSF_Analytics_Loader' ) ) {
			return;
		}

		$surerank_bsf_analytics = \BSF_Analytics_Loader::get_instance();

		$surerank_bsf_analytics->set_entity(
			[
				'surerank' => [
					'product_name'        => 'SureRank',
					'path'                => SURERANK_DIR . 'inc/lib/bsf-analytics',
					'author'              => 'SureRank',
					'time_to_display'     => '+24 hours',
					'hide_optin_checkbox' => true,
				],
			]
		);

		add_filter( 'bsf_core_stats', [ $this, 'add_surerank_analytics_data' ] );
	}

	/**
	 * Callback function to add SureRank specific analytics data.
	 *
	 * @param array<string, mixed> $stats_data existing stats_data.
	 * @since 1.4.0
	 * @return array<string, mixed>
	 */
	public function add_surerank_analytics_data( $stats_data ) {
		$other_stats               = [
			'site_language'     => get_locale(),
			'gsc_connected'     => $this->get_gsc_connected(),
			'plugin_version'    => SURERANK_VERSION,
			'php_version'       => phpversion(),
			'wordpress_version' => get_bloginfo( 'version' ),
		];
		$stats                     = array_merge(
			$other_stats,
			$this->get_failed_site_seo_checks(),
			$this->get_enabled_features()
		);
		$stats_data['plugin_data'] = [
			'surerank' => $stats,
		];
		return $stats_data;
	}

	/**
	 * Get failed site SEO checks.
	 *
	 * @return array<string,int>
	 */
	private function get_failed_site_seo_checks() {
		$failed_checks      = Get::option( 'surerank_site_seo_checks', [] );
		$failed_checks_list = [];
		foreach ( $failed_checks as $check ) {
			foreach ( $check as $key => $value ) {
				if ( isset( $value['status'] ) && $value['status'] === 'error' ) {
					$failed_checks_list[ $key ] = 0;
				}
			}
		}
		return $failed_checks_list;
	}

	/**
	 * Get enabled features.
	 *
	 * @return array<string, mixed>
	 */
	private function get_enabled_features() {
		return [
			'enable_page_level_seo' => Settings::get( 'enable_page_level_seo' ),
			'enable_google_console' => Settings::get( 'enable_google_console' ),
			'enable_schemas'        => Settings::get( 'enable_schemas' ),
		];
	}

	/**
	 * Get Google Search Console connected status.
	 *
	 * @return bool
	 */
	private function get_gsc_connected() {
		return Controller::get_instance()->get_auth_status();
	}
}
