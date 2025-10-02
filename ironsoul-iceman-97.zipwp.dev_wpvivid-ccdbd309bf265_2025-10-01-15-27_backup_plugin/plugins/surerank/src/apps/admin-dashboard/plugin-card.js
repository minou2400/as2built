import { Container, Button, Label, Loader, Skeleton } from '@bsf/force-ui';
import { cn } from '@Functions/utils';
import { FETCH_STATUS } from './dashboard-constants';

export const PluginCard = ( {
	item,
	onInstall,
	fetchStatus,
	getPluginStatus,
	getProgressStatus,
	renderInstallButtonText,
} ) => (
	<Container.Item key={ item.name } className="md:w-full lg:w-full flex">
		<Container
			className="flex-1 gap-1 shadow-sm p-2 rounded-md bg-background-primary"
			containerType="flex"
			direction="column"
		>
			<Container.Item>
				<Container className="items-start gap-1.5 p-1">
					<Container.Item
						className="flex mt-0.5"
						grow={ 0 }
						shrink={ 0 }
					>
						<item.icon className="size-5" />
					</Container.Item>
					<Container.Item className="flex">
						<Label className="text-sm font-medium">
							{ item.name }
						</Label>
					</Container.Item>
				</Container>
			</Container.Item>
			<Container.Item className="gap-0.5 p-1" grow={ 1 }>
				<Label
					variant="help"
					className="text-sm font-normal text-text-tertiary"
				>
					{ item.description }
				</Label>
			</Container.Item>
			<Container.Item className="gap-0.5 px-1 pt-2 pb-1">
				{ fetchStatus.status === FETCH_STATUS.LOADING ? (
					<Skeleton className="w-16 h-6" variant="rectangular" />
				) : (
					<Button
						className={ cn(
							'p-1 focus:[box-shadow:none] [&>svg]:size-3 hover:no-underline',
							getPluginStatus( item ) === 'active' &&
								'disabled:bg-badge-background-green disabled:text-button-tertiary-color'
						) }
						size="sm"
						variant="outline"
						onClick={ () => onInstall( item ) }
						icon={
							getProgressStatus( item ) && (
								<Loader className="text-icon-primary" />
							)
						}
						iconPosition="left"
						loading={ getProgressStatus( item ) }
						disabled={ getPluginStatus( item ) === 'active' }
					>
						{ renderInstallButtonText( item ) }
					</Button>
				) }
			</Container.Item>
		</Container>
	</Container.Item>
);
