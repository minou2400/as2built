import { SeoPopupTooltip } from '@/apps/admin-components/tooltip';
import { Text, Button } from '@bsf/force-ui';
import { __ } from '@wordpress/i18n';
import { cn } from '@Functions/utils';
const pricingLink = window?.surerank_globals?.surerank_url ?? '';

const FixButton = ( {
	size = 'xs',
	tooltipProps,
	title = __( 'Fix SEO Issues with AI', 'surerank' ),
	description = (
		<>
			<span>
				{ __(
					'Let AI automatically detect and resolve on-page SEO problems, such as missing SEO descriptions, image alt tags, and more.',
					'surerank'
				) }
			</span>
			<br />
			<span className="mt-2 block">
				{ __( 'Coming Soon in SureRank Pro.', 'surerank' ) }
			</span>
		</>
	),
	link = pricingLink,
	linkLabel = __( 'Join Waitlist', 'surerank' ),
	iconPosition = 'left',
	icon,
	buttonLabel = __( 'Fix It for Me', 'surerank' ),
	className,
	hidden = true,
	locked = true,
	...props
} ) => {
	const buttonComponent = (
		<Button
			className={ cn( 'w-fit', hidden && 'hidden', className ) }
			size={ size }
			icon={ icon }
			iconPosition={ iconPosition }
			{ ...props }
		>
			{ buttonLabel }
		</Button>
	);

	// If locked is false, render just the button without tooltip
	if ( ! locked ) {
		return buttonComponent;
	}

	// If locked is true (default), render with tooltip
	return (
		<SeoPopupTooltip
			arrow
			interactive
			placement="top-end"
			{ ...tooltipProps }
			content={
				<div className="space-y-1">
					<Text size={ 12 } weight={ 600 } color="inverse">
						{ title }
					</Text>
					<Text
						size={ 12 }
						weight={ 400 }
						color="inverse"
						className="leading-relaxed"
					>
						{ description }
					</Text>
					<div className="mt-1.5">
						<Button
							size="xs"
							variant="link"
							className="[&>span]:px-0 no-underline hover:no-underline focus:[box-shadow:none] text-link-inverse hover:text-link-inverse-hover"
							tag="a"
							href={ link }
							target="_blank"
						>
							{ linkLabel }
						</Button>
					</div>
				</div>
			}
		>
			{ buttonComponent }
		</SeoPopupTooltip>
	);
};

export default FixButton;
