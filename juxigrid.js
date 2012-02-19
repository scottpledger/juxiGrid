(function( $ ) {
	$.widget( "custom.juxigrid", {
		UUID : false,
		getUUID: function(){
			if(!this.UUID){
				this.UUID=parseInt(Number.MAX_VALUE*Math.random());
			}
			return this.UUID
		},
		// HTML Elements to store (all as jQuery Objects)
		mainDiv    : false,
		titleDiv   : false,
		topbarDiv  : false,
		tableDiv   : false,
		dataTable  : false,
		searchDiv  : false,
		botbarDiv  : false,
		statusArea : false,
		rowMenu    : false,
		
		components : {
			search_btn  : $('<input type="checkbox" id="sb"/><label for="sb">Search</label>'),
			first_btn   : $('<button>First</button>'),
			last_btn    : $('<button>Last</button>'),
			prev_btn    : $('<button>Previous</button>'),
			next_btn    : $('<button>Next</button>'),
			refresh_btn : $('<button>Refresh</button>'),
			set_page    : $('<input type="text" size="4" value="1" />'),
			set_rp      : $('<select></select>'),
			search_term : $('<input type="text" value="" />'),
			search_field: $('<select></select>'),
			search_submit:$('<button>Search</button>'),
			disp_pg_cnt : $('<p>1</p>'),
			disp_row_f  : $('<p>1</p>'),
			disp_row_l  : $('<p>1</p>'),
			disp_row_t  : $('<p>1</p>')
		},
		
		// Data Values to store
		data      : Array(),
		page      : 1,    //current page
		page_count: 1,    // total pages
		row_count : 0,    // total rows
		row_first : 1,
		row_last  : 1,
		
		
		
		// These options will be used as defaults
		options: {
			title: "juxigrid Table",
			height: false, // auto height
			width: false,  // auto width
			resizable: true, //allow table resizing
			url: false, //URL if using data from AJAX
			method: 'POST', //data sending method
			dataType: 'html', //type of data for AJAX, either xml or json
			page: 1, //current page
			useRp: true, //use the results per page select box
			rp: 15, //results per page
			rpOptions: [10, 15, 20, 30, 50, 100], //allowed per-page values 
			colModel : [/*{display: 'First Name', name : 'first_name', width : 150, sortable : true, align: 'left'}*/],
			buttons : false,//[/*{name: 'Edit', bclass: 'edit', onpress : doCommand}*/],
			rowactions: false,//[/*{name: 'Edit', bclass: 'edit', onpress : doCommand}*/],
			searchitems : false,//[/*{display: 'Surname', name : 'surname', isdefault: true}*/],
			sortname: false,
			sortorder: "asc",
			singleSelect: false,
			botBarTemplate: ['{toggle:search}','{|}','{set:rp}','{|}','{first}','{prev}','{|}','Page ','{set:page}',' of ','{page_count}','{|}','{next}','{last}','{|}','{refresh}','{|}','{status}'],
			searchTemplate: ['Find all items where ','{search_field}',' is ','{search_term}','.','{search_submit}'],
			styles:{
				mainDiv:'ui-widget ui-widget-content ui-corner-all',
				titleDiv:'ui-widget-header ui-corner-top',
				topbarDiv: 'ui-widget-header',
				tableDiv: 'ui-widget-content',
				searchDiv:'ui-state-highlight',
				botbarDiv:'ui-widget-header ui-corner-bottom'
			}, 
			status_templates: {
				display: ['Displaying ','{from}',' to ','{to}',' of ','{row_count}', ' items.'],
				none: ['No items.'],
				fetch: ['Fetching Items....'],
				error: ['Connection Error!'],
				success: ['Got data!']
			},
			query: '',
			qtype: '',
			rememberSelected:true,
			hideOnSubmit: true,
			autoload: true,
			onDragCol: false,
			onToggleCol: false,
			onChangeSort: false,
			onSuccess: false,
			onError: false,
			onSubmit: false
		},

		// Set up the widget
		_create: function() {
			var self = this;
			
			$(this.element).hide();
			this.mainDiv   = $('<div class="ui-juxigrid '+this.options.styles.mainDiv+'"></div>');
			this.titleDiv  = $('<h3 class="tiDiv '+this.options.styles.titleDiv+'"></h3>');
			this.topbarDiv = $('<div class="toDiv '+this.options.styles.topbarDiv+'"></div>');
			this.tableDiv  = $('<div class="taDiv '+this.options.styles.tableDiv+'"></div>');
			this.dataTable = $('<table><thead><tr class="ui-state-default"></tr></thead><tbody></tbody></table>');
			this.searchDiv = $('<div class="seDiv '+this.options.styles.searchDiv+'"></div>');
				this.searchDiv.hide();
			this.botbarDiv = $('<div class="boDiv '+this.options.styles.botbarDiv+'"></div>');
			this.statusArea= $('<span></span>');
			
			this.tableDiv.append(this.dataTable);
			this.mainDiv.append(this.titleDiv);
			this.mainDiv.append(this.topbarDiv);
			this.mainDiv.append(this.tableDiv);
			this.mainDiv.append(this.searchDiv);
			this.mainDiv.append(this.botbarDiv);
			this._makeTitle();
			this._makeButtons();
			this._makeDataTable();
			this._makeFooter();
			
			$(this.element.context).after(this.mainDiv);
			
			if(this.options.width){
				$(this.mainDiv).width(this.options.width);
			} else {
				$(this.mainDiv).width(this.dataTable.outerWidth());
			}
			
			if(this.options.height){
				$(this.mainDiv).height(this.options.height);
			}
			
			this.mainDiv.resizable({
				alsoResize:this.tableDiv
			});
			
			if(this.options.autoload) {
				this.refresh();
			}
			
		},
		
		_initComponents: function(){
			var self=this;
			
			this.components.search_btn.first().button({
				text: false,
				icons: {
					primary: "ui-icon-search"
				}
			}).change(function(){
				if($(this).is(':checked')){
					self.showSearch();
				} else {
					self.hideSearch();
				}
			});
			
			this.components.first_btn.button({
				text: false,
				icons: {
					primary: "ui-icon-seek-first"
				}
			}).click(function(){self.firstPage.call(self);});
			
			this.components.last_btn.button({
				text: false,
				icons: {
					primary: "ui-icon-seek-end"
				}
			}).click(function(){self.lastPage.call(self);});
			
			this.components.prev_btn.button({
				text: false,
				icons: {
					primary: "ui-icon-seek-prev"
				}
			}).click(function(){self.prevPage.call(self);});
			
			this.components.next_btn.button({
				text: false,
				icons: {
					primary: "ui-icon-seek-next"
				}
			}).click(function(){self.nextPage.call(self);});
			
			this.components.refresh_btn.button({
				text: false,
				icons: {
					primary: "ui-icon-refresh"
				}
			}).click(function(){
				self.refresh.call(self);
				return false;
			});
			
			this.components.set_page.change(function(){
				var newp = parseInt($(this).val());
				if(newp != NaN){
					self.options.page=newp;
					self.refresh();
				} else {
					$(this).val(self.options.page);
				}
			});
			
			
			this.components.set_rp.change(function(){
				var newrp = parseInt($(this).val());
				if(newrp!=NaN){
					self.options.rp=newrp;
					self.refresh();
				} else {
					$(this).val(self.options.rp);
				}
			});
			
			this.components.search_field.change(function(){
				self.options.qtype=$(this).val();
			});
			
			this.components.search_term.change(function(){
				self.options.query=$(this).val();
			});
			
			this.components.search_submit.button({
				icons: {
					primary: "ui-icon-search"
				}
			}).click(function(){
				self.refresh();
			});
		},
		
		_updateComponents: function() {
			this.components.first_btn.button('disable');
			this.components.prev_btn.button('disable');
			this.components.last_btn.button('disable');
			this.components.next_btn.button('disable');
			
			if(this.options.page-2 > 0){
				this.components.first_btn.button('enable');
			}
			
			if(this.options.page-1 > 0){
				this.components.prev_btn.button('enable');
			}
			
			if(this.options.page<this.page_count){
				this.components.next_btn.button('enable');
			}
			
			if(this.options.page+1<this.page_count){
				this.components.last_btn.button('enable');
			}
			
			this.components.set_page.val(this.options.page);
			
			this.components.set_rp.html('');
			for (i=0;i<this.options.rpOptions.length;i++) {
				var sel_el = $('<option value="'+this.options.rpOptions[i]+'">'+this.options.rpOptions[i]+'</option>');
				this.components.set_rp.append(sel_el);
			}
			this.components.set_rp.val(this.options.rp);
			
			if(this.options.use_rp){
				this.components.set_rp.hide();
			} else {
				this.components.set_rp.show();
			}
			
			this.components.disp_pg_cnt.html(this.page_count);
			this.components.disp_row_t.html(this.row_count);
			
			this.components.disp_row_f.html(this.row_first);
			this.components.disp_row_l.html(this.row_last);
			
			if(this.options.resizable){
				this.mainDiv.resizable('enable');
			} else {
				this.mainDiv.resizable('disable');
			}
			
			this.components.search_field.html('<option value="">Please Select One</option>');
			for (i=0;i<this.options.searchitems.length;i++) {
				var sel_el = $('<option value="'+this.options.searchitems[i].name+'">'+this.options.searchitems[i].display+'</option>');
				this.components.search_field.append(sel_el);
			}
			if(this.options.qtype!=''){
				this.components.search_field.val(this.options.qtype)
			} else {
				this.options.qtype=this.components.search_field.val();
			};
			
		},

		_makeTitle: function() {
			if(this.options.title!=undefined && this.options.title!=false){
				this.titleDiv.html(this.options.title);
			} else {
				this.titleDiv.hide();
			}
		},

		_makeButtons: function() {
			if(this.options.buttons){
				var self=this;
				$(this.options.buttons).each(function(index,btn_def){
					var btn = $('<button>'+btn_def.name+'</button>');
					if(btn_def.options==undefined){
						btn_def.options={};
					}
					btn.button(btn_def.options);
					if(btn_def.oncreate!=undefined){
						btn_def.oncreate(btn);
					}
					if(btn_def.onclick!=undefined){
						btn.click(btn_def.onclick);
					}
					self.topbarDiv.append(btn);
				});
			} else {
				this.topbarDiv.hide();
			}
		},

		_makeDataTable: function() {
			this._makeTableHead();
			this._makeTableBody();
		},

		_makeRowContextMenu: function() {
			var self=this;
			
		},

		_makeTableHead: function() {
			var tHead = $('thead tr',this.dataTable);
			tHead.html("");
			var self = this;
			$(this.options.colModel).each(function(index,col){
				var icon_class="ui-icon-none";
				if(self.options.sortname==col.name){
					if(self.options.sortorder=="desc"){
						icon_class="ui-icon-carat-1-s";
					} else {
						icon_class="ui-icon-carat-1-n";
					}
				}
				var container = $('<div class="ui-button ui-widget ui-state-default ui-button-text-icons"></div>');
				var icon      = $('<span class="ui-button-icon-primary ui-icon '+icon_class+'"></span>');
				var label     = $('<span class="ui-button-text">'+col.display+'</span>');
				var th = $('<th class="ui-juxigrid-col-'+col.name+'"></th>');
				
				container.append(icon);
				container.append(label);
				
				th.append(container);
				
				tHead.append(th);
				th.data('colData',col);
				container.resizable({
					handles:'e',
					alsoResize:'.ui-juxigrid-col-'+col.name
				});
				container.hover(function(){
					container.resizable('option','alsoResize','td div.ui-juxigrid-col-'+col.name);
					container.addClass('ui-state-hover');
					if (icon.hasClass('ui-icon-carat-1-s')) {
						icon_class="ui-icon-carat-1-s";
						icon.removeClass(icon_class);
						icon.addClass('ui-icon-carat-1-n');
					} else if(icon.hasClass('ui-icon-carat-1-n')) {
						icon_class="ui-icon-carat-1-n";
						icon.removeClass(icon_class);
						icon.addClass('ui-icon-carat-1-s');
					} else if(icon.hasClass('ui-icon-none')) {
						icon_class="ui-icon-none";
						icon.removeClass(icon_class);
						icon.addClass('ui-icon-carat-1-n');
					}
				},function(){
					$(this).removeClass('ui-state-hover');
					icon.removeClass('ui-icon-none ui-icon-carat-1-n ui-icon-carat-1-s');
					icon.addClass(icon_class);
				}).click(function(){
					if (icon.hasClass('ui-icon-carat-1-s')) {
						self.options.sortorder="desc";
					} else if(icon.hasClass('ui-icon-carat-1-n')) {
						self.options.sortorder="asc";
					}
					self.options.sortname=col.name;
					self.refresh();
				});
				if(col.hide){
					th.hide();
				}
			});
		},

		

		_makeTableBody: function() {
			var self = this;
			var tBody = $('tbody',this.dataTable);
			
			var selected=Array();
			if(this.options.rememberSelected){
				selected=this.getSelectedAttrs('id');
			}
			tBody.children().remove();
			$(this.data).each(function(index,row){
				var tr = $('<tr></tr>');
				tr.data('rowData',row);
				$(self.options.colModel).each(function(index,col){
					var td = $('<td><div class="ui-juxigrid-col-'+col.name+'"></div></td>');
					$('div',td).html(row.cell[col.name]);
					if (col.hide) {
						td.hide();
					}
					td.hover(function(){
						tr.addClass('ui-state-hover');
					},function(){
						tr.removeClass('ui-state-hover');
					}).click(function(){
						if(!tr.hasClass('ui-state-active')){
							if(self.options.singleSelect){
								$('tbody tr',self.dataTable).removeClass('ui-state-active');
							}
							tr.addClass('ui-state-active');
						} else {
							tr.removeClass('ui-state-active');
						}
					});
					tr.append(td);
				});
				
				if(selected.length>0 && 0<=$.inArray(row.id,selected)){
					tr.addClass('ui-state-active');
				} else {
					tr.removeClass('ui-state-active');
				}
				tBody.append(tr);
			});
			self._setStatus.call(self,'display');
		},

		_getData: function() {
			var self=this;
			if(this.options.dataType=="html" && this.element.context.tagName.toLowerCase()=="table") {
				self.data = new Array();
				$('th',this.element).each(function(){
					$(self.options.colModel).add({
						display:$(this).html(),
						width: $(this).width(),
						sortable:true,
						align:'left'
					});
				});
				
				$('tr',this.element).each(function(row_index,row_el){
					if($('td',this).length>0){
						var newRow = {
							id:row_index,
							cell:[]
						};
						$('td',this).each(function(index,el){
							$(newRow.cell).add(this.innerHtml);
						});
						$(self.data).add(newRow);
					}
				});
			} else if(this.options.dataType=="json") {
				if(this.loading!=undefined && this.loading==true){
					return true;
				} else {
					this.loading = true;
				}
				if (self.options.onSubmit) {
					if (!self.options.onSubmit()) {
						return false;
					}
				}
				
				if (self.options.page > self.options.page_count) {
					self.options.page = self.options.page_count;
				}
				var param = [{
					name: 'page',
					value: self.options.page
				}, {
					name: 'rp',
					value: self.options.rp
				}, {
					name: 'sortname',
					value: self.options.sortname
				}, {
					name: 'sortorder',
					value: self.options.sortorder
				}, {
					name: 'query',
					value: self.options.query
				}, {
					name: 'qtype',
					value: self.options.qtype
				}];
				if (self.options.params) {
					for (var pi = 0; pi < self.options.params.length; pi++) {
						param[param.length] = self.options.params[pi];
					}
				}
				
				$.ajax({
					type: self.options.method,
					url: self.options.url,
					data: param,
					dataType: self.options.dataType,
					success: function (data) {
						//self._setStatus.call(self,'success');
						self.options.page=Number(data.page);
						self.row_count=Number(data.total);
						self.row_first=(self.options.page-1)*self.options.rp+1;
						self.row_last =Math.min((self.row_first+self.options.rp-1),self.row_count);
						self.page_count=parseInt(self.row_count/self.options.rp)+1;
						self.data=data.rows;
						
						self.loading=false;
						self._makeTableBody.call(self);
						
					},
					error: function (XMLHttpRequest, textStatus, errorThrown) {
						self._setStatus('error');
						try {
							if (self.options.onError) self.options.onError(XMLHttpRequest, textStatus, errorThrown);
						} catch (e) {}
						console.log(this,self);
						self.loading=false;
					}
				});
				
				
			}
		},


		_makeFooter: function() {
			this.botbarDiv.html('');
			this._appendTemplate(this.options.searchTemplate,this.searchDiv);
			this._appendTemplate(this.options.botBarTemplate,this.botbarDiv);
		},



		// Use the _setOption method to respond to changes to options
		_setOption: function( key, value ) {
			switch( key ) {
				case "clear":
					// handle changes to clear option
					break;
			}

			// jQuery UI 1.8 support:
			$.Widget.prototype._setOption.apply( this, arguments );
			// jQuery UI 1.9 support:
			this._super( "_setOption", key, value );
		},
		
		_setStatus: function(new_status) {
			var status_template=['INVALID STATUS'];
			switch(new_status){
				case 'display':
					status_template=this.options.status_templates.display;
					break;
				case 'none':
					status_template=this.options.status_templates.none;
					break;
				case 'fetch':
					status_template=this.options.status_templates.fetch;
					break;
				case 'error':
					status_template=this.options.status_templates.error;
					break;
				case 'success':
					status_template=this.options.status_templates.success;
					break;
			}
			
			this.status=new_status;
			this.statusArea.children().remove();
			
			this._appendTemplate(status_template,this.statusArea);
			this._updateComponents();
			
		},
		
		_appendTemplate: function(template_array,parent_el){
			var self=this;
			var parent_el=$(parent_el);
			for(i=0;i<template_array.length;i++){
				var init_i=i;
				var new_el=false;
				switch(template_array[i]){
					case '{|}':
						new_el='<span class="v_separator"></span>';
						break;
					case '{toggle:search}':
						new_el=self.components.search_btn;
						break;
					case '{first}':
						new_el=self.components.first_btn;
						break;
					case '{prev}':
						new_el=self.components.prev_btn;
						break;
					case '{next}':
						new_el=self.components.next_btn;
						break;
					case '{last}':
						new_el=self.components.last_btn;
						break;
					case '{refresh}':
						new_el=self.components.refresh_btn;
						break;
					case '{set:rp}':
						new_el=self.components.set_rp;
						break;
					case '{set:page}':
						new_el=self.components.set_page;
						break;
					case '{status}':
						new_el=this.statusArea;
						break;
					case '{page_count}':
						new_el=self.components.disp_pg_cnt;
						break;
					case '{row_count}':
						new_el=self.components.disp_row_t;
						break;
					case '{from}':
						new_el=self.components.disp_row_f;
						break;
					case '{to}':
						new_el=self.components.disp_row_l;
						break;
					case '{search_field}':
						new_el=self.components.search_field;
						break;
					case '{search_term}':
						new_el=self.components.search_term;
						break;
					case '{search_submit}':
						new_el=self.components.search_submit;
						break;
				}
				if(new_el==false){
					new_el=$('<p>'+template_array[i]+'</p>');
				}
				parent_el.append(new_el);
				
				i=init_i;
			}
			this._initComponents();
		},
		
		showSearch: function() {
			this.searchDiv.slideDown();
		},
		
		hideSearch: function() {
			this.searchDiv.slideUp();
		},
		
		prevPage: function() {
			this.options.page=Math.max(this.options.page-1,1);
			this.refresh();
		},
		
		nextPage: function() {
			this.options.page=Math.min(this.options.page+1,this.page_count);
			this.refresh();
		},
		
		firstPage: function() {
			this.options.page=1;
			this.refresh();
		},
		
		lastPage: function() {
			this.page_count=1;
			this.refresh();
		},
		
		refresh: function() {
			this._getData();
		},
		
		getSelected: function() {
			var selected=Array();
			$('tbody tr.ui-state-active',this.dataTable).each(function(index,el){
				selected.push($(el).data('rowData'));
			});
			return selected;
		},
		getSelectedAttrs: function(attrName) {
			var selected=Array();
			$('tbody tr.ui-state-active',this.dataTable).each(function(index,el){
				selected.push($(el).data('rowData')[attrName]);
			});
			return selected;
		},
		
		clearSelected: function() {
			$('tbody tr.ui-state-active',this.dataTable).removeClass('ui-state-active');
		},

		// Use the destroy method to clean up any modifications your widget has made to the DOM
		destroy: function() {
			// In jQuery UI 1.8, you must invoke the destroy method from the base widget
			$.Widget.prototype.destroy.call( this );
			// In jQuery UI 1.9 and above, you would define _destroy instead of destroy and not call the base method
		}
	});
	
}( jQuery ) );
