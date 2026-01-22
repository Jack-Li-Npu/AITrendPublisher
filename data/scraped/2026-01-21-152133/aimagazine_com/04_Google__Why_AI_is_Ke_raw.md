Responsible AI
# Google: Why AI is Key to Alleviating Climate Change Impacts
By [Tom Chapman](https://aimagazine.com/author/tom-chapman)
January 19, 2026
![](https://assets.bizclikmedia.net/138/2885612dbc9457b539b3d3b5bbb8985d:e61a0744a54d102a9b78b3a3faa067c7/gettyimages-2193122077.webp)
Climate change is resulting in elevated frequency of both heatwaves and rainfall events (Credit: Getty Images)
Google's open-sourced model NeuralGCM merges machine learning with physics for more accurate precipitation forecasting and climate modelling
Precipitation forecasting represents one of the most challenging aspects of global-scale weather and climate modelling, according to [Google](https://aimagazine.com/company/google), with uncertainties surrounding timing, volume and geographical distribution posing persistent difficulties.
The tech giant has launched NeuralGCM, an open-source hybrid atmospheric model that merges machine learning capabilities with traditional physics to deliver rapid and precise global atmospheric simulations.
The system demonstrates improved accuracy in reproducing average precipitation patterns, extreme rainfall events and daily weather cycles, with particularly notable enhancement for the most severe 0.1% of rainfall occurrences.
Created within Google's broader Earth AI initiative, this hybrid physics and AI approach works alongside AI-only platforms like the recently enhanced WeatherNext 2, extending analytical capabilities for extended-range weather and climate assessment.
![Youtube Placeholder](https://i.ytimg.com/vi/KUAWw32FjIo/hqdefault.jpg)
## Applying AI to physical weather systems
Climate change could lead to increased melting of sea ice and glaciers, rising sea levels and elevated frequency of both heatwaves and rainfall events, according to the UK Met Office.
Simulating precipitation requires monitoring cloud systems, yet these vary significantly in scale, type and characteristics, creating challenges for large-scale model resolution. Traditional models employ approximations called parameterisations to account for small-scale atmospheric processes like cloud formation.
Rather than relying on conventional parameterisations, NeuralGCM employs a neural network that learns the effects of small-scale events directly from existing weather data. In the current iteration, precipitation is represented with greater accuracy by training the [machine learning](https://aimagazine.com/machine-learning) component on satellite-based precipitation observations.
Previous versions used training data based on reconstructed atmospheric conditions that combine physics-based models with observations. This process often fails to capture the complexity of cloud physics and consequently struggles with precipitation extremes and daily cycles.
The precipitation module was trained on NASA satellite observations gathered between 2001 and 2018, allowing NeuralGCM to develop a more accurate machine-learned parameterisation of precipitation directly from high-quality observational data.
"Better weather models equal better climate resilience," writes Robert Little, Sustainability Strategy Lead & Subject Matter Expert at Google, on [LinkedIn](https://aimagazine.com/company/linkedin).
![](https://assets.bizclikmedia.net/668/3e8a25cfee5331ec88b94bbd1d979e3e:235f8c2bb969f7976545b1119afc9e5f/robert-little.jpeg)
Robert Little, Sustainability Strategy Lead & Subject Matter Expert at Google
## Precipitation forecasting capabilities
The system's performance underwent assessment using WeatherBench 2 across two-week forecasts, with comparisons drawn against a leading physics-based model from the European Centre for Medium-range Weather Forecasts (ECMWF).
NeuralGCM surpassed the ECMWF model at low resolution across most precipitation metrics, including both 24-hour and six-hour accumulated rainfall over all 15 forecast days, with particularly strong performance over land where impacts on populations and ecosystems carry greater significance.
While its current 280 km resolution remains too coarse for operational forecasting, the findings suggest clear potential for implementing this approach at finer scales.
Across extended timescales spanning years to decades, NeuralGCM achieved an average mean error of less than 0.5 mm per day, reducing error by 40% compared with leading global atmospheric models used in the latest Intergovernmental Panel on Climate Change report.
The model achieved marked progress in capturing extreme rainfall events, particularly the most intense 0.1% of precipitation. NeuralGCM also more accurately reproduced the daily timing and intensity of precipitation, including strong diurnal cycles such as afternoon rainfall in the Amazon during summer.
Accurate capture of precipitation timing and location could prove critical for applications ranging from flood and drought management to climate science, ecosystem resilience and public safety.
![](https://assets.bizclikmedia.net/668/49c13ded1ec3afa5bf32a9f77be1f39c:01a7e70c3a11ecd12144b737d338ee8d/neuralgcm-precipitation-1-final-width-1250.jpg)
NeuralGCM uses a hybrid framework that combines a traditional fluid dynamics solver (gray sphere) for large-scale processes with AI neural networks (cartoon box and umbrella) for small-scale physics, like clouds, radiation and precipitation. Credit: Google
## Real-world applications
Google states that NeuralGCM serves as a "step forward for large-scale precipitation forecasts and simulations".
A partnership between the University of Chicago and the Indian Ministry of Agriculture and Farmers Welfare employed NeuralGCM to predict monsoon season onset. In 2025, the pair selected NeuralGCM and one other model to build and deploy a forecasting tool.
"Since introducing NeuralGCM we have made everything available as open-source code on which we hope people can build," Google adds. "This precipitation model is also being openly released to the extended community.
"Ultimately our hope is that these efforts will bring us one step closer to accurate long-term projections of future precipitation, especially under climate change."
## Company portals
- ![](https://assets.bizclikmedia.net/127/0f5d9de756b68dbb0807157bd7a0504c:a844150f2d60ef2fa7ad2b849aa7daf8/google-g-logo-svg.png)
### [Google](https://aimagazine.com/company/google)
- ![](https://assets.bizclikmedia.net/127/5d6c62f5db4f127085d98a2fd301d716:d9f537e916d0f8647e99c7b9349d0002/picture)
### [Google Cloud](https://aimagazine.com/company/google-cloud)
- ![](https://assets.bizclikmedia.net/127/bde80f6210bd69caf70ab4908041751d:e5bb67648f35f0abb0a7607be5c4b322/picture)
### [Google DeepMind](https://aimagazine.com/company/googledeepmind)
## Executives
- ![](https://assets.bizclikmedia.net/220/6a8f5b6ab90e8b58cb4c696c8ba56229:e1f545c2f6c50dbeca07bada99524f1c/1694035535713-e-1763596800-v-beta-t-mdqacthxlclagnjkjl-icbdh7jk-chwfhihkvhwvgg4)![](https://assets.bizclikmedia.net/220/6a8f5b6ab90e8b58cb4c696c8ba56229:e1f545c2f6c50dbeca07bada99524f1c/1694035535713-e-1763596800-v-beta-t-mdqacthxlclagnjkjl-icbdh7jk-chwfhihkvhwvgg4)
### [Robert Little](https://aimagazine.com/executive/robert-little)
Sustainability Strategy Lead - gTech
## Tags
Company Portals
- ![](https://assets.bizclikmedia.net/127/0f5d9de756b68dbb0807157bd7a0504c:a844150f2d60ef2fa7ad2b849aa7daf8/google-g-logo-svg.png)
### [Google](https://aimagazine.com/company/google)
- ![](https://assets.bizclikmedia.net/127/5d6c62f5db4f127085d98a2fd301d716:d9f537e916d0f8647e99c7b9349d0002/picture)
### [Google Cloud](https://aimagazine.com/company/google-cloud)
- ![](https://assets.bizclikmedia.net/127/bde80f6210bd69caf70ab4908041751d:e5bb67648f35f0abb0a7607be5c4b322/picture)
### [Google DeepMind](https://aimagazine.com/company/googledeepmind)
![](https://assets.bizclikmedia.net/321/fd84578bc357db861082d425b268e504:d6adddda7ca1d8f4f84227f17c28e789/01-cover-ai-jan2026.jpg)
![](https://assets.bizclikmedia.net/321/fd84578bc357db861082d425b268e504:d6adddda7ca1d8f4f84227f17c28e789/01-cover-ai-...