<?php
/**
 * Common Meta Data
 *
 * This file handles functionality to generate sitemap in frontend.
 *
 * @package surerank
 * @since 0.0.1
 */

namespace SureRank\Inc\Sitemap;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

use SureRank\Inc\Functions\Cache;
use SureRank\Inc\Functions\Helper;
use SureRank\Inc\Functions\Settings;
use SureRank\Inc\Schema\Helper as Schema_Helper;
use SureRank\Inc\Traits\Get_Instance;
use WP_Query;

/**
 * XML Sitemap
 * Handles functionality to generate XML sitemaps.
 *
 * @since 1.0.0
 */
class Xml_Sitemap extends Sitemap {

	use Get_Instance;
	/**
	 * Sitemap slug to be used across the class.
	 *
	 * @var string
	 */
	private static $sitemap_slug = 'sitemap_index';

	/**
	 * Constructor
	 *
	 * Sets up the sitemap functionality if XML sitemaps are enabled in settings.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function __construct() {

		add_filter(
			'surerank_flush_rewrite_settings',
			[ $this, 'flush_settings' ],
			10,
			1
		);

		if ( ! Settings::get( 'enable_xml_sitemap' ) ) {
			return;
		}

		add_filter( 'wp_sitemaps_enabled', '__return_false' );
		add_action( 'template_redirect', [ $this, 'template_redirect' ] );
		add_action( 'parse_query', [ $this, 'parse_query' ], 1 );
	}

	/**
	 * Array of settings to flush rewrite rules on update settings
	 *
	 * @param array<string, mixed> $settings Existing settings to flush.
	 * @since 1.0.0
	 * @return array<string, mixed>
	 */
	public function flush_settings( $settings ) {
		$settings[] = 'enable_xml_sitemap';
		$settings[] = 'enable_xml_image_sitemap';
		return $settings;
	}

	/**
	 * Returns the sitemap slug.
	 *
	 * @since 1.0.0
	 * @return string
	 */
	public static function get_slug(): string {
		return self::$sitemap_slug . '.xml';
	}

	/**
	 * Redirects default WordPress sitemap requests to custom sitemap URLs.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function template_redirect() {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return;
		}
		$current_url = sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) );
		$current_url = explode( '/', $current_url );
		$last_url    = end( $current_url );

		$sitemap = [
			'sitemap.xml',
			'wp-sitemap.xml',
			'index.xml',
		];

		if ( in_array( $last_url, $sitemap, true ) ) {
			wp_safe_redirect( '/' . self::get_slug(), 301 );
			exit;
		}
	}

	/**
	 * Parses custom query variables and triggers sitemap generation.
	 *
	 * @param \WP_Query $query Current query object.
	 * @since 1.0.0
	 * @return void
	 */
	public function parse_query( \WP_Query $query ) {
		if ( ! $query->is_main_query() && ! is_admin() ) {
			return;
		}

		$type  = sanitize_text_field( get_query_var( 'surerank_sitemap' ) );
		$style = sanitize_text_field( get_query_var( 'surerank_sitemap_type' ) );

		if ( ! $type && ! $style ) {
			return;
		}

		if ( $style ) {
			Utils::output_stylesheet( $style );
		}

		$page      = absint( get_query_var( 'surerank_sitemap_page' ) ) ? absint( get_query_var( 'surerank_sitemap_page' ) ) : 1;
		$threshold = apply_filters( 'surerank_sitemap_threshold', 200 );

		do_action( 'surerank_sitemap_before_generation', $type, $page, $threshold );

		// Dynamically handle CPTs.
		if ( post_type_exists( $type ) ) {
			$this->generate_main_sitemap( $type, $page, $threshold );
			return;
		}

		$this->generate_sitemap( $type, $page, $threshold );

		do_action( 'surerank_sitemap_after_generation', $type, $page, $threshold );
	}

	/**
	 * Generates the appropriate sitemap based on the requested type.
	 *
	 * @param string $type Sitemap type requested.
	 * @param int    $page Current page number for paginated sitemaps.
	 * @param int    $threshold Threshold for splitting sitemaps.
	 * @since 1.0.0
	 * @return void
	 */
	public function generate_sitemap( string $type, int $page, $threshold ) {

		$sitemap = [];

		if ( '1' === $type ) {
			$sitemap_index = Cache::get_file( 'sitemap_index.json' );
			$sitemap       = $sitemap_index ? json_decode( $sitemap_index, true ) : $this->generate_index_sitemap( $threshold );
			$this->sitemapindex( $sitemap );
		}

		$this->generate_main_sitemap( $type, $page, $threshold );
	}

	/**
	 * Generates a sitemap for WooCommerce product categories.
	 *
	 * @return array<string, mixed>|array<int, string> List of product category URLs for the sitemap.
	 */
	public function generate_product_cat_sitemap() {
		remove_all_actions( 'parse_query' );
		$args         = [
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
			'number'     => 0,
		];
		$product_cats = get_terms( $args );

		$sitemap = [];
		if ( is_array( $product_cats ) ) {
			foreach ( $product_cats as $product_cat ) {
				$sitemap[] = get_term_link( $product_cat->term_id );
			}
		}
		return $sitemap;
	}

	/**
	 * Generates the index sitemap based on content thresholds.
	 *
	 * @param int $threshold Threshold for splitting sitemaps.
	 * @return array<int, array{link: string, updated: string}> List of URLs for the index sitemap.
	 */
	public function generate_index_sitemap( int $threshold ) {
		$sitemap_types = $this->collect_sitemap_types();
		$sitemap       = [];

		foreach ( $sitemap_types as $type => $total ) {
			if ( ! $this->should_include_type( $type, $total ) ) {
				continue;
			}

			$last_modified = $this->get_type_last_modified( $type );
			$sitemap       = array_merge( $sitemap, $this->build_sitemap_entries( $type, $total, $threshold, $last_modified ) );
		}

		return $sitemap;
	}

	/**
	 * Generates the main sitemap for a specific type, page, and offset.
	 *
	 * @param string $type Post type or taxonomy.
	 * @param int    $page Current page number.
	 * @param int    $offset Number of posts to retrieve.
	 * @since 1.0.0
	 * @return void
	 */
	public function generate_main_sitemap( string $type, int $page, int $offset = 1000 ) {
		remove_all_actions( 'parse_query' );
		$sitemap = [];

		$prefix_param = sanitize_text_field( get_query_var( 'surerank_prefix' ) );
		if ( Cache::file_exists( 'sitemap_index.json' ) ) {
			$sitemap = $this->get_sitemap_from_cache( $type, $page, $prefix_param );
			$this->generate_main_sitemap_xml( $sitemap );
		}

		// Handle CPTs dynamically.
		if ( post_type_exists( $type ) ) {
			$sitemap = $this->generate_post_sitemap( $type, $page, $offset );
		} elseif ( 'author' === $type ) {
			$sitemap = $this->generate_author_sitemap( $page, $offset );
		} elseif ( 'category' === $type ) {
			$sitemap = $this->generate_category_sitemap( $page, $offset );
		} elseif ( 'post-tag' === $type ) {
			$sitemap = $this->generate_post_tag_sitemap( $page, $offset );
		} elseif ( 'product-category' === $type ) {
			$sitemap = $this->generate_product_category_sitemap( $page, $offset );
		} elseif ( taxonomy_exists( $type ) ) {
			$sitemap = $this->generate_taxonomy_sitemap( $type, $page, $offset );
		}

		do_action( 'surerank_sitemap_generated', $sitemap, $type, $page ); // this action can be used to modify the sitemap data.

		$this->generate_main_sitemap_xml( $sitemap );
	}

	/**
	 * Outputs the sitemap index as XML.
	 *
	 * @param array<string, mixed>|array<int, string> $sitemap Sitemap index data.
	 * @since 1.0.0
	 * @return void
	 */
	public function sitemapindex( array $sitemap ) {
		echo Utils::sitemap_index( $sitemap ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- XML is safely generated in sitemap_index
		exit;
	}

	/**
	 * Outputs the main sitemap as XML.
	 *
	 * @param array<string, mixed>|array<int, string> $sitemap Sitemap data for main sitemap.
	 * @since 1.0.0
	 * @return void
	 */
	public function generate_main_sitemap_xml( array $sitemap ) {
		echo Utils::sitemap_main( $sitemap ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- XML is safely generated in sitemap_main
		exit;
	}

	/**
	 * Get sitemap url
	 *
	 * @return string
	 */
	public function get_sitemap_url() {
		return home_url( self::get_slug() );
	}

	/**
	 * Collect all sitemap types with their counts.
	 *
	 * @return array<string, int> Array of type => count.
	 */
	private function collect_sitemap_types() {
		$sitemap_types = [];

		// Add post types.
		$sitemap_types = array_merge( $sitemap_types, $this->get_post_type_counts() );

		// Add taxonomies.
		return array_merge( $sitemap_types, $this->get_taxonomy_counts() );
	}

	/**
	 * Get counts for all enabled post types.
	 *
	 * @return array<string, int> Post type counts.
	 */
	private function get_post_type_counts(): array {
		$counts = [];
		$cpts   = apply_filters( 'surerank_sitemap_enabled_cpts', Helper::get_public_cpts() );

		foreach ( $cpts as $cpt ) {
			if ( 'attachment' === $cpt->name ) {
				continue;
			}
			$counts[ $cpt->name ] = $this->get_total_count( $cpt->name );
		}

		return $counts;
	}

	/**
	 * Get counts for all enabled taxonomies.
	 *
	 * @return array<string, int> Taxonomy counts.
	 */
	private function get_taxonomy_counts() {
		$counts            = [];
		$custom_taxonomies = apply_filters(
			'surerank_sitemap_enabled_taxonomies',
			Schema_Helper::get_instance()->get_taxonomies( [ 'public' => true ] )
		);

		foreach ( $custom_taxonomies as $custom_taxonomy ) {
			$counts[ $custom_taxonomy['slug'] ] = $this->get_total_count( $custom_taxonomy['slug'] );
		}

		return $counts;
	}

	/**
	 * Check if a type should be included in the sitemap.
	 *
	 * @param string $type Content type.
	 * @param int    $total Total count.
	 * @return bool True if should include.
	 */
	private function should_include_type( string $type, int $total ) {
		return ! $this->check_noindex( $type, 'check' ) && $total > 0;
	}

	/**
	 * Get last modified date for a content type.
	 *
	 * @param string $type Content type.
	 * @return string|null Last modified date or null.
	 */
	private function get_type_last_modified( string $type ) {
		if ( post_type_exists( $type ) ) {
			return $this->get_post_type_last_modified( $type );
		}

		if ( taxonomy_exists( $type ) ) {
			return $this->get_taxonomy_last_modified( $type );
		}

		return null;
	}

	/**
	 * Get last modified date for a post type.
	 *
	 * @param string $type Post type.
	 * @return string|null Last modified date or null.
	 */
	private function get_post_type_last_modified( string $type ) {
		$args = [
			'post_type'      => $type,
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'orderby'        => 'modified',
			'order'          => 'DESC',
		];

		return $this->query_last_modified( $args );
	}

	/**
	 * Get last modified date for a taxonomy.
	 *
	 * @param string $type Taxonomy.
	 * @return string|null Last modified date or null.
	 */
	private function get_taxonomy_last_modified( string $type ) {
		$args = [
			'post_type'      => 'any',
			'post_status'    => 'publish',
			'posts_per_page' => 1,
			'orderby'        => 'modified',
			'order'          => 'DESC',
			'tax_query'      => [ //phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
				[
					'taxonomy' => $type,
					'operator' => 'EXISTS',
				],
			],
		];

		return $this->query_last_modified( $args );
	}

	/**
	 * Query for last modified date.
	 *
	 * @param array<string, mixed> $args Query arguments.
	 * @return string|null Last modified date or null.
	 */
	private function query_last_modified( array $args ): ?string {
		$query         = new WP_Query( $args );
		$last_modified = null;

		if ( $query->have_posts() && $query->posts[0] instanceof \WP_Post ) {
			$modified_time = get_post_modified_time( 'c', false, $query->posts[0]->ID );
			if ( false !== $modified_time ) {
				$last_modified = (string) $modified_time;
			}
		}

		wp_reset_postdata();
		return $last_modified;
	}

	/**
	 * Build sitemap entries for a type.
	 *
	 * @param string      $type Content type.
	 * @param int         $total Total count.
	 * @param int         $threshold Threshold for splitting.
	 * @param string|null $last_modified Last modified date.
	 * @return array<int, array{link: string, updated: string}> Sitemap entries.
	 */
	private function build_sitemap_entries( string $type, int $total, int $threshold, ?string $last_modified ) {
		$entries = [];
		$updated = $last_modified ? esc_html( (string) $last_modified ) : current_time( 'c' );

		// Default handling for standard sitemaps.
		if ( $total >= $threshold ) {
			$total_sitemaps = ceil( $total / $threshold );
			for ( $i = 1; $i <= $total_sitemaps; $i++ ) {
				$entries[] = [
					'link'    => home_url( "{$type}-sitemap-{$i}.xml" ),
					'updated' => $updated,
				];
			}
		} else {
			$entries[] = [
				'link'    => home_url( "{$type}-sitemap.xml" ),
				'updated' => $updated,
			];
		}

		return apply_filters( 'surerank_build_sitemap_entries', $entries, $type, $total, $threshold, $updated );
	}

	/**
	 * Get sitemap from cache
	 *
	 * @param string $type Sitemap type.
	 * @param int    $page Page number.
	 * @param string $prefix_param Prefix name.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function get_sitemap_from_cache( string $type, int $page, string $prefix_param ) {
		// Calculate which chunks belong to this page based on threshold and chunk size.
		$sitemap_threshold = apply_filters( 'surerank_sitemap_threshold', 200 );
		$chunk_size        = apply_filters( 'surerank_sitemap_json_chunk_size', 20 );

		$chunks_per_sitemap = (int) ceil( $sitemap_threshold / $chunk_size );
		$start_chunk        = ( $page - 1 ) * $chunks_per_sitemap + 1;
		$end_chunk          = $page * $chunks_per_sitemap;

		$combined_sitemap = [];
		for ( $chunk_number = $start_chunk; $chunk_number <= $end_chunk; $chunk_number++ ) {
			$chunk_file      = $prefix_param . '-' . $type . '-chunk-' . $chunk_number . '.json';
			$cache_file_data = Cache::get_file( $chunk_file );

			if ( ! $cache_file_data ) {
				continue;
			}

			$chunk_data = json_decode( $cache_file_data, true );
			if ( is_array( $chunk_data ) ) {
				$combined_sitemap = array_merge( $combined_sitemap, $chunk_data );
			}
		}

		return $combined_sitemap;
	}

	/**
	 * Generates the author sitemap.
	 *
	 * @param int $page Page number.
	 * @param int $offset Number of authors to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_author_sitemap( int $page, int $offset ) {
		// Author-based sitemap logic.
		$args = [
			'role__in' => [ 'Administrator', 'Editor', 'Author' ],
			'number'   => $offset,
			'paged'    => $page,
		];

		$authors = get_users( $args );

		$sitemap = [];
		if ( is_array( $authors ) ) {
			foreach ( $authors as $author ) {
				$sitemap[] = [
					'link'    => get_author_posts_url( $author->ID ),
					'updated' => gmdate( 'Y-m-d\TH:i:sP', strtotime( $author->user_registered ) ),
				];
			}
		}

		return $sitemap;
	}

	/**
	 * Generates the category sitemap.
	 *
	 * @param int $page Page number.
	 * @param int $offset Number of categories to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_category_sitemap( int $page, int $offset ) {
		return $this->generate_taxonomy_sitemap( 'category', $page, $offset );
	}

	/**
	 * Generates the post-tag sitemap.
	 *
	 * @param int $page Page number.
	 * @param int $offset Number of tags to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_post_tag_sitemap( int $page, int $offset ) {
		return $this->generate_taxonomy_sitemap( 'post_tag', $page, $offset );
	}

	/**
	 * Generates the product-category sitemap.
	 *
	 * @param int $page Page number.
	 * @param int $offset Number of product categories to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_product_category_sitemap( int $page, int $offset ) {
		return $this->generate_taxonomy_sitemap( 'product_cat', $page, $offset );
	}

	/**
	 * Generates the sitemap for a specific taxonomy.
	 *
	 * @param string $taxonomy Taxonomy name.
	 * @param int    $page Page number.
	 * @param int    $offset Number of terms to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_taxonomy_sitemap( string $taxonomy, int $page, int $offset ) {
		$terms = $this->get_terms_query( $taxonomy, $page, $offset );

		if ( ! $terms ) {
			return [];
		}

		if ( ! is_array( $terms ) ) {
			return [];
		}

		$modif = new WP_Query(
			[
				'taxonomy'  => $taxonomy,
				'showposts' => 1,
			]
		);

		$last_modified = isset( $modif->posts[0] ) && $modif->posts[0] instanceof \WP_Post
			? $modif->posts[0]->post_modified
			: null;

		$last_modified_timestamp = is_string( $last_modified ) ? strtotime( $last_modified ) : null;

		$sitemap = [];
		foreach ( $terms as $term ) {
			$term_id = $term->term_id ?? null;
			if ( ! $term_id ) {
				continue;
			}

			if ( $this->is_noindex_term( $term_id, $taxonomy ) ) {
				continue;
			}
			$sitemap[] = [
				'link'    => get_term_link( $term_id ),
				'updated' => $last_modified_timestamp ? gmdate( 'Y-m-d\TH:i:sP', $last_modified_timestamp ) : null,
			];
		}

		return $sitemap;
	}

	/**
	 * Generates the post sitemap, including images if enabled.
	 *
	 * @param string $type Post type.
	 * @param int    $page Page number.
	 * @param int    $offset Number of posts to retrieve.
	 * @return array<string, mixed>|array<int, string>
	 */
	private function generate_post_sitemap( string $type, int $page, int $offset ) {
		$query = $this->get_posts_query( $type, $page, $offset );

		if ( ! $query ) {
			return [];
		}

		$sitemap = [];
		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();

				if ( $this->is_noindex( (int) get_the_ID(), $type ) ) {
					continue;
				}
				$url_data = [
					'link'        => esc_url( (string) get_permalink() ),
					'updated'     => esc_html( (string) get_the_modified_date( 'c' ) ),
					'images'      => 0,
					'images_data' => [],
				];

				if ( empty( Settings::get( 'enable_xml_image_sitemap' ) ) ) {
					$sitemap[] = $url_data;
					continue;
				}

				$images = Utils::get_images_from_post( (int) get_the_ID() );

				if ( is_array( $images ) && ! empty( $images ) ) {
					$url_data['images']      = count( $images );
					$url_data['images_data'] = array_map(
						static function ( $image_url ) {
							return [
								'link'    => esc_url( $image_url ),
								'updated' => esc_html( (string) get_the_modified_date( 'c' ) ),
							];
						},
						$images
					);
				}

				$sitemap[] = $url_data;
			}
			wp_reset_postdata();
		}
		return $sitemap;
	}

}
