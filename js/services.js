'use strict';

/* Services */

angular.module('thisApp.services', [])
  
  // Facets declaration
  .factory('Facets', function (FacetFactory) {
    // Namespace
    let ns = {};

    ns.factory = FacetFactory;

    // Below we declare a series of facets we use in this project
    // The source of all data in there
    ns.tweets_csv = FacetFactory.newFacet('tweets.csv', {cached:true, dataFormat:'csv'});

    // The clean and rich list of tweets
    ns.tweetList = FacetFactory.newFacet('tweetList', {
      dependencies:['tweets.csv'],
      compute: function(){
        let tweets_csvData = FacetFactory.getFacet('tweets.csv').getData();
        let data = [...tweets_csvData].map(item => {
          item.time = new Date(item.time * 1000);
          item.created_at = new Date(item.created_at);
          return item;
        });
        console.log(data);
        return data;
      },
      serialize: function (data) {
        return data.map(serializeTweet);
      },
      unserialize: function (data) {
        return data.map(unserializeTweet);
      },
    });
    
    ns.tweetCount = FacetFactory.newFacet('tweetCount', {
      dependencies:['tweetList'],
      compute: function(){
        return FacetFactory.getFacet('tweetList').getData().length;
      },
    })

    // Tweet serialization
    function serializeTweet(item) {
      item.time = item.time.toISOString();
      item.created_at = item.created_at.toISOString();
      return item;
    }

    function unserializeTweet(item) {
      item.time = new Date(item.time);
      item.created_at = new Date(item.created_at);
      return item;
    }

    return ns;
  })

  .factory('FacetFactory', function () {
    // Namespace
    let ns = {};

    // Properties
    ns.facetDictionary = {};
    // TODO: implement a config setting for cache location
    ns.cacheLocation = 'data/cache/'

    ns.getFacetList = function () {
      let result = [];

      for (let i in ns.facetDictionary) {
        result.push( ns.facetDictionary[i] );
      }

      return result;
    }

    ns.requireFacet = function (id, opts_) {
      let f = ns.getFacet(id);
      if (f) return f;
      return ns.newFacet(id, opts_);
    }

    ns.getFacet = function (id) {
      return ns.facetDictionary[id];
    }

    /**
     * Valid ways of creating a facet:
     *
     * A. With the data itself:
     *    newFacet('jedi', {data:{name:'Anakin Skywalker'}})
     *
     * B. With a cache:
     *    newFacet('jedi', {cached:true})
     *    Note: you have to ensure that the cached file is
     *          actually at the proper location
     *
     * C. With a compute method involving no dependency:
     *    newFacet('jedi', {compute:function(){return {name:'Anakin Skywalker'}}})
     *
     * D. With a compute method involving dependencies:
     *    newFacet('jediLastName', {
     *      dependencies:['jedi'],
     *      compute: function(){
     *        return getFacet('jedi').getData().name.split(' ')[1]
     *      }
     *    })
     */
    ns.newFacet = function (id, opts_) {
      const opts = opts_ || {};
      let facet = {};

      if (id) {
        if (ns.facetDictionary[id] === undefined) {
          /**
           * Facet lifecycle:
           * 1. Is it ready? YES: get the data. NO: go deeper.
           * 2. Is it cached? YES: load the data. NO: go deeper.
           * 3. Are dependencies ready? YES: compute the data.
           *    NO: Get the dependencies, then compute the data.
           *
           * NOTE: Loadability, compute method and dependencies have to be managed elsewhere.
           *       The facet object is just a helper to organize the lifecycle.
           */
          if (opts.data === undefined && !opts.cached && (opts.compute === undefined || typeof opts.compute !== 'function') ) {
            console.log(`Impossible to create facet without data OR cache OR a compute method. id:${id}`, facet);
            return;
          }
          facet.id = id;
          facet.data = undefined;
          facet.serialize = x => x;
          facet.unserialize = x => x;
          facet.formatSerialize = undefined;
          facet.formatUnserialize = undefined;
          facet.ready = false;
          facet.cached = false;
          facet.dependencies = [];
          facet._compute = opts.compute;
          facet.dataFormat = 'json';

          // Check and apply options
          if (opts.cached) { facet.cached = true; }

          if (opts.dependencies) {
            if (Array.isArray(opts.dependencies)) {
              facet.dependencies = opts.dependencies;
            } else {
              console.log(`Dependencies not added because they are not an array. Facet id:${id}`, facet);
            }
          }

          if (!Array.isArray(facet.dependencies)) {
            console.log(`Impossible to create facet because dependencies are not an array. id:${id}`, facet);
            return;
          }

          if (opts.data !== undefined) {
            facet.data = opts.data;
            facet.ready = true;
          }

          if (opts.dataFormat) {
            switch (opts.dataFormat) {
              case 'json':
                facet.formatUnserialize = JSON.parse;
                facet.formatSerialize = JSON.stringify;
                break;
              case 'csv':
                facet.formatUnserialize = d3.csv.parse;
                facet.formatSerialize = d3.csv.format;
                break;
              case 'csvRows':
                facet.formatUnserialize = d3.csv.parseRows;
                facet.formatSerialize = d3.csv.formatRows;
                break;
              default:
                console.log(`Unknown dataFormat ${opts.dataFormat} for facet ${id}`)
                break;
            }
          }

          if (opts.serialize) {
            facet.serialize = opts.serialize
          }

          if (opts.unserialize) {
            facet.unserialize = opts.unserialize
          }
          
          facet.isReady = () => facet.ready;
          facet.isCached = () => !!facet.cached;
          facet.getDependencies = () => facet.dependencies;

          facet.retrieveData = function (callback) {
            if (facet.isReady()) {
              facet.callData(callback);
            } else if (facet.isCached()) {
              facet.loadData(callback);
            } else if (facet.areDependenciesReady()) {
              facet.computeData(callback);
            } else {
              let unreadyDependency = facet.dependencies.some(id => {
                let dependencyFacet = ns.getFacet(id);
                if (dependencyFacet && dependencyFacet.isReady && dependencyFacet.isReady()) {
                  // Dependency is OK
                  return false;
                } else {
                  // Dependency needs to be retrieved
                  dependencyFacet.retrieveData(() => {
                    facet.retrieveData(callback);
                  })
                  return true;
                }
              })
            }
          }

          facet.getData = function () {
            if (facet.isReady()) {
              return facet.data;
            } else {
              console.log(`Impossible to get data because this facet is not ready: ${facet.id}`, facet);
            }
          }

          // Like getData but in an asynchronous fashion
          facet.callData = function (callback) {
            if (facet.isReady()) {
              callback(facet.data);
            } else {
              console.log(`Impossible to call data because this facet is not ready: ${facet.id}`, facet);
            }
          }

          facet.loadData = function (callback) {
            if (facet.isCached()) {
              let url = ns.getFacetCacheURL(facet.id);
              $.get(url, function(d){
                facet.data = facet.formatUnserialize(d);
                facet.ready = true;
                callback(facet.data);
              }).fail(function() {
                  console.log(`Facet loading failed for unknown reasons.\nid:${id}\nurl:${url}`, facet);
                })
            } else {
              console.log(`Unloadable facet: ${id}`, facet);
            }
          }

          facet.areDependenciesReady = function () {
            let ready = true
            // FIXME: stop the forEach once one false found
            facet.dependencies.forEach(id => {
              let dependencyFacet = ns.getFacet(id);
              if (dependencyFacet && dependencyFacet.isReady && dependencyFacet.isReady()) {
                // Dependency is OK
              } else {
                ready = false;
              }
            })
            return ready;
          }

          facet.computeData = function (callback) {
            if (facet.areDependenciesReady()) {
              facet.data = facet._compute();
              facet.ready = true;
              callback(facet.data);
            } else {
              console.log(`Facet not computed because dependencies are not ready. id: ${id}`, facet);
            }
          }

          ns.facetDictionary[facet.id] = facet;
          return facet;
        } else {
          console.log(`Facet not created because its id already exists: ${id}`, facet);
        }
      } else {
        console.log('Facet not created because it has no id', facet);
      }
    }

    ns.deleteFacet = function (id) {
      delete ns.facetDictionary[id];
    }

    ns.getFacetCacheURL = function (d) {
      let id;
      if (typeof d == 'object' && d[id]) {
        // d is the facet (though it should be the id...)
        id = d[id];
      } else {
        id = d;
      }

      if (typeof id === 'string') {
        let safeId = encodeURIComponent(id);
        return `${ns.cacheLocation}${safeId}`;
      } else {
        console.log(`Cannot retrieve cache URL from id ${id}`, facet);
      }
    }

    return ns;
  })