<?php
/**
 * Schema_Render
 *
 * This file will handle functionality for rendering schema data with placeholders and merging it with a specific schema type.
 *
 * @package surerank
 * @since 1.0.0
 */

namespace SureRank\Inc\Schema;

/**
 * Class Schema_Render
 *
 * Responsible for rendering schema data with placeholders and merging it with a specific schema type.
 */
class Schema_Render {
	/**
	 * The schema type (e.g., Article, Product, etc.).
	 *
	 * @var string
	 */
	private $type;

	/**
	 * The fields or data associated with the schema.
	 *
	 * @var array<string, mixed>
	 */
	private $fields;

	/**
	 * The variable renderer for processing dynamic placeholders.
	 *
	 * @var Render
	 */
	private $variable_renderer;

	/**
	 * Schema_Render constructor.
	 *
	 * @param string               $type              The schema type.
	 * @param array<string, mixed> $fields            The fields to render.
	 * @param Render               $variable_renderer The renderer for processing placeholders.
	 */
	public function __construct( string $type, array $fields, Render $variable_renderer ) {
		$this->type              = $type;
		$this->fields            = $fields;
		$this->variable_renderer = $variable_renderer;
	}

	/**
	 * Render the schema data with resolved placeholders.
	 *
	 * @return array<string, mixed> The rendered schema data merged with the schema type.
	 */
	public function render() {
		foreach ( $this->fields as &$value ) {
			$this->variable_renderer->render( $value );
		}

		if ( isset( $this->fields['sameAs'] ) && is_array( $this->fields['sameAs'] ) ) {
			$this->fields['sameAs'] = array_values( $this->fields['sameAs'] );
		}

		$this->fields['@type'] = $this->type;
		$schema                = array_merge( [ '@type' => $this->type ], $this->fields );

		return $this->remove_empty( $this->remove_schema_name( $schema ) );
	}

	/**
	 * Remove empty or null values from an array recursively.
	 *
	 * @param array<string, mixed> $data The array to filter.
	 * @return array<string, mixed> Filtered array with non-empty values.
	 */
	private function remove_empty( array $data ) {
		foreach ( $data as $key => $value ) {
			if ( is_array( $value ) ) {
				$data[ $key ] = $this->remove_empty( $value );
				if ( empty( $data[ $key ] ) ) {
					unset( $data[ $key ] );
				}
			} elseif ( empty( $value ) && 0 !== $value ) {
				unset( $data[ $key ] );
			}
		}
		return $data;
	}

	/**
	 * Remove the schema name from the array.
	 *
	 * @param array<string, mixed> $schema The schema to remove the name from.
	 * @return array<string, mixed> The schema with the name removed.
	 */
	private function remove_schema_name( array $schema ) {
		if ( isset( $schema['schema_name'] ) ) {
			unset( $schema['schema_name'] );
		}

		return $schema;
	}
}
