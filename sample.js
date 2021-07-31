$(document).ready(function ()
{
	const builders = window.builders

	let data_timer, repaint_timer
	
	// Flag containing group by filter the user has selected
	let timeline_filter = 'area'
	
	// DOM element where the Timeline will be attached
	let container
	
	// Create a DataSet (allows two way data-binding)
	let items
	let groups
	
	// Create a Timeline 
	let timeline
	
	// Contains current date range for items within timeline
	let currentRange
	
	let currentStartTime
	let currentEndTime
	
	// Get action which task timeline will use to get data
	let tasks_action = $(".task-timeline").data('action')

	let update_request

	let chart_view_range = 10
	let chart_refresh = 10000

	let main_container = $('section.task-container')

	if (main_container.length > 0) {
		chart_view_range = main_container.data('chart-view-range')
		chart_refresh = main_container.data('chart-refresh')
	}

	const taskViewLocalStorage = {
		gettingTaskDataKey: 'task-view-getting-task-data'
	}

	// Configuration for the Timeline
	const options = {
		stack: false,
		start: moment().subtract(12, 'hour'),
		end: new Date(1000 * 60 * 60 * 24 + (new Date()).valueOf()),
		editable: false,
		min: moment().subtract(1, 'month'),
		zoomMin: 1000000,
		zoomMax: 700000000,
		// throttleRedraw: 100,
		margin: {
			item: 0, // minimal margin between items
			axis: 0   // minimal margin between items and the axis
		},
		autoResize: true,
		orientation: 'top',
		maxHeight: 500,
		verticalScroll: true,
		moveable: true,
		zoomable: false,
		showCurrentTime: true, // Shows red playhead
		dataAttributes: [
			'id',
			'area',
			'procedure',
			'task',
			'currentStartTime',
			'duration',
			'status',
			'task_id',
			'site_code',
			'area_code',
			'task_schedule_no',
			'scheduled_dtm',
			'end_dtm',
			'inspection_state'
		]
	}

	init_timeline()

	function trigger_get_data() {
		get_data()
		data_timer = setTimeout(trigger_get_data, chart_refresh)
	}
	
	/* load data via an ajax request. When the data is in, load the timeline */
	function init_timeline() {
		
		// If a timeline already exists, destroy it.
		if (timeline) {
			timeline.destroy()
		}
		
		update_request = $.ajax({
			url: tasks_action,
			type: "POST",
			data: {'group_by': timeline_filter},
			success: function (data) {
				
				let task_data = JSON.parse(data)
				
				// DOM element where the Timeline will be attached
				container = document.getElementById('monikaTasksTimeline')
				
				// Create a DataSet (allows two way data-binding)
				items = new vis.DataSet(task_data.data.items)
				groups = new vis.DataSet(task_data.data.groups)
				
				// Create a Timeline
				container = document.getElementById('monikaTasksTimeline')
				timeline = new vis.Timeline(container, null, options)
				timeline.setGroups(groups)
				timeline.setItems(items)
				
				// Set the current time
				let currentTime = timeline.getCurrentTime()
				
				// Get the initial range for data, setting the min and max points to start and end times
				currentRange = timeline.getItemRange()
				currentStartTime = moment(currentRange.min).subtract(chart_view_range, 'day').toDate()
				currentEndTime = moment(currentRange.max).toDate()

				items.add({
					id: 1,
					type: "background",
					start: moment(currentRange.min).subtract(1, 'year').toDate(),
					end: currentTime,
					className: "past-section"
				})

				// Event listener for click event
				timeline.on('select', function (properties) {

					// Get the item which has been clicked
					let visItem = $(".vis-item[data-id='" + properties.items + "']")

					// Format both the current time and end_dtm values, for use in determining if perform/verify actions can be performed on a task occurrence.
					let current_time_formatted = moment(currentTime).format('YYYY-MM-DD HH:mm:ss ZZ')
					let end_dtm_formatted = moment(visItem.data('end_dtm')).format('YYYY-MM-DD HH:mm:ss ZZ')
					
					/*
					 * Set the status of our action buttons. Clauses are separated out to help improve readability,
					 * and to help with debugging.
					*/
					
					// Check that the selected item is in progress and can be with either performed or verified
					if (visItem.data('status') === 'task-status-code-A') {
						// Removed disabled flag from action buttons
						$("#task-action-perform, #task-action-verify").prop("disabled", false)
					}
					// Check to see if the task occurrence has passed.
					else if (moment(end_dtm_formatted).isBefore(current_time_formatted)) {
						// Disable perform and verification buttons
						$("#task-action-perform, #task-action-verify").prop("disabled", true)

					}
					// Is the task occurrence awaiting verification
					else if (visItem.data('status') === 'task-status-code-I' || visItem.data('status') === 'task-status-code-W' || (visItem.data('status') === 'task-status-code-S' && visItem.data('inspection_state').toString() === 'false')) {
						// Removed disabled flag from verify action button
						$("#task-action-perform").prop("disabled", true)
						$("#task-action-verify").prop("disabled", false)
					}
					// Has the task occurrence been verified already.
					else if (visItem.data('inspection') === 't' || visItem.data('inspection') === 'f') {
						// Disable perform and verification buttons
						$("#task-action-perform, #task-action-verify").prop("disabled", true)
					}
					else {
						// Disable perform and verification buttons
						$("#task-action-perform, #task-action-verify").prop("disabled", true)
					}
				})

				/**
                 * Event listener for end of pan or scroll event.
				 * Loads data for newly viewable sections of the timeline
				 */
				timeline.on('rangechanged', function (properties) {

					$('#timeline-updating').addClass('active')
					$('#monikaTasksTimeline').addClass('updating')

					/*
					 * Set the start and end bound for our dataset to the new min and max date values
					 * This is not ideal but helps with performance when dataset gets large.
					 */
					currentStartTime = moment(properties.start).subtract(chart_view_range, 'day').toDate()
					currentEndTime = moment(properties.end).toDate()

					trigger_get_data()

				})

				timeline.on('rangechange', function() {
					if (update_request.state() === 'pending')
						update_request.abort()

					clearTimeout(data_timer)
				})

				timeline.on('currentTimeTick', updatePaintedArea)

				trigger_get_data()

				$('#timeline-loader').fadeOut('100', function () {
					if (task_data.data.items.length === 0) {
						$('#timeline-no-data')
							.css('display', 'block')
							.addClass('shown')
					}

					else {
						$('.timeline-container, .task-timeline-header, .view-switch-container')
							.css('display', 'block')
							.addClass('shown')
					}
				})

				localStorage.setItem(taskViewLocalStorage.gettingTaskDataKey, 'false')
			}
		})
	}

	function get_data() {
		let lsKey = taskViewLocalStorage.gettingTaskDataKey
		let lsVal = localStorage.getItem(lsKey)

		if (lsVal) {
			// console.log('key exists / value: ' + lsVal)
			if (lsVal === 'true') {
				// console.log('getting data already - returning')
				// return false
			}
		}

		localStorage.setItem(lsKey, 'true')
		// console.log('about to get data')

		let task_data
		update_request = $.ajax({
			type: "POST",
			url: tasks_action,
			data: {
				'group_by': timeline_filter,
				'start_time': currentStartTime,
				'end_time': currentEndTime
			},
			success: function (data) {
				try {
					task_data = JSON.parse(data)
				}
				catch (e) {
					window.location.reload()
					return
				}

				// Create a DataSet (allows two way data-binding)
				items.update(task_data.data.items)
				groups.update(task_data.data.groups)

				if (task_data.data.items.length === 0) {
					$('.timeline-container, .task-timeline-header, .view-switch-container')
						.css('display', 'none')
						.removeClass('shown')

					$('#timeline-no-data')
						.css('display', 'block')
						.addClass('shown')
				}
				else {
					$('.timeline-container, .task-timeline-header, .view-switch-container')
						.css('display', 'block')
						.addClass('shown')

					$('#timeline-no-data')
						.css('display', 'none')
						.removeClass('shown')
				}

				let selectData = [];
				let selectedOption = $('#task-list-filter').val()

				// loop through the dates
				_.forEach(task_data.data.items, (item) => {
				    selectData['All'] = 'All'
					if (item.area_code === selectedOption) {
						selectData[item.area_code] = item.area
					}
				})

				// assign the menu
				const menu = document.querySelector('#task-list-filter')

				// reset the drop menu
				builders.buildDropMenu(menu, selectData)

				$('#timeline-updating').removeClass('active')
				$('#monikaTasksTimeline').removeClass('updating')

				localStorage.setItem(taskViewLocalStorage.gettingTaskDataKey, 'false')
			}
		})
	}
}
