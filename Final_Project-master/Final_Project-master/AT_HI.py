#------------#
#-- author --#
#------------#
# Jason Schatz
# Created:  04.14.2016
# Python 2.7.2


#-----------------#
#-- description --#
#-----------------#
# Calculates apparent temperature and heat index given tair and rh pairs


#----------------------#
#-- define functions --#
#----------------------#
def ATcalc(tair, rh):
	'''Calculates apparent temperature (AT) after Steadman (1984):
	
	AT = −1.3 + 0.92 * T + 2.2 * e, where:
	    T = dry bulb air temperature (degrees C)
	    e = vapor pressure in kPa, calculated after Buck (1981)

	Args:
		tair: dry bulb air temperature in degrees C
		rh: relative humidity (in decimals, e.g. 0.25 rather than 25%)

	Returns:
		AT: apparent temperature
	'''
	rh = rh * 0.01
	es = 0.61078 * np.exp((17.269 * tair)/(tair + 237.3))
	e  = es * rh
	AT = -1.3 + 0.92 * tair + 2.2 * e
	return AT

def HIbase(tair, rh):
	'''Base equation for HI calculation (enter ?HIcalc for full details)'''
	HI = -42.379 + \
	     2.04901523 * tair + \
	     10.14333127 * rh - \
	     0.22475541 * tair * rh - \
	     0.00683783 * tair * tair - \
	     0.05481717 * rh * rh + \
	     0.00122874 * tair * tair * rh + \
	     0.00085282 * tair * rh * rh - \
	     0.00000199 * tair * tair * rh * rh
	return HI

def HIconditions(df):
	'''Conditional statements for HI calculation adjustments 
	(enter ?HIcalc for full details)'''
	rh = df['rh']
	tair = df['tair']
	if rh < 13 and tair >= 80 and tair < 112:
		return HIbase(tair, rh) - ((13-rh)/4) * ((17 - abs(tair - 95))/17) ** 0.5
	elif rh > 85 and tair > 80 and tair < 87:
		return HIbase(tair, rh) + ((rh - 85) / 10) * ((87 - tair) / 5)
	elif tair < 80:
		return 0.5 * (tair + 61.0 + ((tair - 68.0) * 1.2) + (rh * 0.094))
	else:
		return HIbase(tair, rh)

def HIcalc(tair, rh):
	'''Calculates heat index from dry bulb temperature and relative humidity, 
	following NOAA's standard heat index equation: 
	http://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml

	Args:
		tair: dry bulb air temperature in degrees C
		rh:   relative humidity (in percent)

	Returns:
		HI: Heat Index
	'''
	tair = tair * 9/5 + 32   #convert to farenheit
	df = pd.DataFrame({'tair':tair,
		               'rh':rh 
		              })
	HI = df.apply(HIconditions, axis=1)
	HI = (HI - 32) * 5/9   # from F to C
	return HI


#----------------------#
#-- import libraries --#
#----------------------#
import numpy as np
import pandas as pd


#-------------------#
#-- open datasets --#
#-------------------#
tair = pd.read_csv('/Users/javargo/Desktop/UHI_calcs/WSC_TempC2016.csv')
rh = pd.read_csv('~/Desktop/UHI_calcs/WSC_RH2016.csv')


#-------------------------#
#-- calculate HI and AT --#
#-------------------------#
HI = HIcalc(tair=tair['VALUE'].values,
	        rh=rh['VALUE'].values)
tair['HI'] = HI

AT = ATcalc(tair=tair['VALUE'].values,
	        rh=rh['VALUE'].values)
tair['AT'] = AT


#------------------------#
#-- aggregate datasets --#
#------------------------#
def re_index(df):
	''' resets index and adds correct column names '''
	df.reset_index(inplace=True)
	df.columns = df.columns.droplevel()
	df.columns = ['SID', 'date', 'time', 'tair', 'HI', 'AT']
	df.drop('time', axis=1, inplace=True)
	return df

mins = tair.groupby(['SID', 'sample_date']).agg(['min'])
maxes = tair.groupby(['SID', 'sample_date']).agg(['max'])
means = tair.groupby(['SID', 'sample_date']).agg(['mean'])

mins = re_index(mins)
maxes = re_index(maxes)
means = re_index(means)


#---------------------------#
#-- write results to file --#
#---------------------------#
outpath = '~/Desktop/UHI_calcs/'   # end path with '/'

mins.to_csv(outpath + 'mins.csv', index=False)
maxes.to_csv(outpath + 'maxes.csv', index=False)
means.to_csv(outpath + 'means.csv', index=False)
