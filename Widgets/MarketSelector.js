﻿/// <reference path="../Scripts/ext-all-debug-w-comments.js" />
/// <reference path="../Scripts/Binary/Binary.Api.Client.js" />

window.Binary = window.Binary || {};

Binary.MarketSelectorClass = function (el, currentMarket, currentSymbol)
{
	var marketStore = Ext.create('Ext.data.Store',
	{
		fields: ['market', 'displayName']
	});

	var symbolStore = Ext.create('Ext.data.Store',
	{
		fields: ['market', 'symbol', 'displayName']
	});

	Binary.Markets = {};
	var selectorContainer = null;
	var marketSelector = null;
	var symbolSelector = null;

	Binary.Api.Client.markets(function (data)
	{
		var marketsCount = data.markets.length;
		for (var i = 0; i < data.markets.length; i++)
		{
			var market = data.markets[i];
			marketStore.add(
			{
				displayName: market.charAt(0).toUpperCase() + market.substr(1),
				market: market
			});
			Binary.Api.Client.markets.market(function (marketData, eventData)
			{
				Binary.Markets[eventData.market] = marketData.symbols;
				for (var s = 0; s < marketData.symbols.length; s++)
				{
					var symbolDetails = marketData.symbols[s];
					symbolStore.add(
					{
						market: eventData.market,
						symbol: symbolDetails.symbol,
						displayName: symbolDetails.display_name
					});
				};
				marketsCount--;
				if (marketsCount == 0)
				{
					Binary.Mediator.fireEvent('marketsAvailable', Binary.Markets);
					selectorContainer = new Ext.container.Container(
					{
						renderTo: el,
						width: '100%',
						layout: 'column',
						style: 'padding: 7px 3px 7px 3px',
						defaults:
						{
							columnWidth: 1 / 2
						},
						listeners:
						{
							afterrender: function ()
							{
								var val = currentMarket || marketSelector.store.getAt(0).get(marketSelector.valueField);
								marketSelector.setValue(val);
							}
						},
						items:
						[
							marketSelector = Ext.create('Ext.form.field.ComboBox',
							{
								valueField: 'market',
								displayField: 'displayName',
								store: marketStore,
								queryMode: 'local',
								editable: false,
								style: 'margin-right: 5px',
								value: 'initial',
								listeners:
								{
									change: function (combo, value)
									{
										Binary.Mediator.fireEvent('marketChanged', value);
										symbolSelector.store.clearFilter();
										symbolSelector.store.filter("market", value);
										if (symbolSelector.getValue() == 'initial' && currentSymbol)
										{
											symbolSelector.setValue(currentSymbol);
										}
										else
										{
											symbolSelector.setValue(symbolSelector.store.getAt(0).get(symbolSelector.valueField));
										}
									}
								}
							}),
							symbolSelector = Ext.create('Ext.form.field.ComboBox',
							{
								valueField: 'symbol',
								displayField: 'displayName',
								store: symbolStore,
								editable: false,
								queryMode: 'local',
								value: 'initial',
								listeners:
								{
									change: function (combo, value)
									{
										Binary.Mediator.fireEvent('symbolChanged',
										{
											symbolDetails: combo.valueModels[0].data,
											marketDetails: marketStore.findRecord('market', combo.valueModels[0].data.market).data
										});
									}
								}
							})
						]
					});
				}
			},
			market,
			{
				market: market
			});
		}
	});
};
