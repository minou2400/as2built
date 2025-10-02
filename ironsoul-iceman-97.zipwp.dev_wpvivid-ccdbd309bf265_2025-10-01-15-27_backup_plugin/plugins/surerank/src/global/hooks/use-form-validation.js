import { z } from 'zod';
import { useState, useCallback } from '@wordpress/element';

/**
 * Custom hook for form validation using Zod
 * @param {Object} formState   - Current form state
 * @param {Array}  inputFields - Array of input field configurations
 * @return {Object} - Returns validation function and error states
 */
const useFormValidation = ( formState, inputFields ) => {
	const [ errors, setErrors ] = useState( {} );

	// Create dynamic schema based on input fields
	const createValidationSchema = useCallback( () => {
		const schema = {};

		inputFields.forEach( ( field ) => {
			let fieldSchema;

			// Add validation based on field type
			switch ( field.type ) {
				case 'text':
				case 'textarea':
					fieldSchema = z.string( {
						required_error: `${ field.label } is required`,
					} );
					break;
				case 'email':
					fieldSchema = z
						.string( {
							required_error: `${ field.label } is required`,
						} )
						.email( 'Please enter a valid email address' );
					break;
				case 'number':
					fieldSchema = z.number( {
						invalid_type_error: `${ field.label } must be a number`,
						required_error: `${ field.label } is required`,
					} );
					break;
				case 'url':
					fieldSchema = z
						.string( {
							required_error: `${ field.label } is required`,
						} )
						.url( 'Please enter a valid URL' );
					break;
				case 'file':
					fieldSchema = z.instanceof( File );
					break;
				case 'checkbox':
					fieldSchema = z.boolean();
					break;
				default:
					fieldSchema = z.string( {
						required_error: `${ field.label } is required`,
					} );
					break;
			}

			// Add required validation
			if ( field.required ) {
				if ( field.type === 'checkbox' ) {
					fieldSchema = fieldSchema.refine(
						( value ) => value === true,
						'This field is required'
					);
				} else {
					fieldSchema = fieldSchema.min(
						1,
						`${ field.label } is required`
					);
				}
			}

			schema[ field.name ] = field.required
				? fieldSchema
				: fieldSchema.optional();
		} );

		return z.object( schema );
	}, [ inputFields ] );

	const validate = useCallback( () => {
		const schema = createValidationSchema();

		try {
			schema.parse( formState );
			setErrors( {} );
			return true;
		} catch ( validationErrors ) {
			const formattedErrors = {};

			validationErrors.errors.forEach( ( error ) => {
				const [ fieldName ] = error.path;
				formattedErrors[ fieldName ] = error.message;
			} );

			setErrors( formattedErrors );

			// Focus on the first field with error
			const firstErrorField = validationErrors.errors[ 0 ]?.path[ 0 ];
			if ( firstErrorField ) {
				const element = document.querySelector(
					`[name="${ firstErrorField }"]`
				);
				if ( element ) {
					element.focus();
				}
			}

			return false;
		}
	}, [ formState, createValidationSchema ] );

	/**
	 * Clear error for a specific field
	 * @param {string} fieldName - Name of the field to clear error for
	 *
	 * @return {void}
	 */
	const clearFieldError = ( fieldName ) => {
		setErrors( ( prevErrors ) => {
			if ( ! prevErrors[ fieldName ] ) {
				return prevErrors;
			}

			const newErrors = { ...prevErrors };
			newErrors[ fieldName ] = '';
			return newErrors;
		} );
	};

	return {
		errors,
		validate,
		clearFieldError,
		isValid: Object.keys( errors ).length === 0,
	};
};

export default useFormValidation;
