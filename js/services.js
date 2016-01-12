'use strict';

/* Services */

angular.module('thisApp.services', [])
  
  .factory('FacetFactory', function ($timeout, $http) {
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
     *        return getFacet('jedi').getData().split(' ')[1]
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
           * 2. Is it loadable? YES: load the data (it's a cache). NO: go deeper.
           * 3. Are dependencies ready? YES: compute the data.
           *    NO: Get the dependencies, then compute the data.
           *
           * NOTE: Loadability, compute method and dependencies have to be managed elsewhere.
           *       The facet is just a helper, it just organizes the life cycle.
           */
          facet.id = id;
          facet.data = undefined
          facet.ready = false;
          facet.loadable = opts.cached || false;
          facet.needsSerialization = false;
          facet.dependencies = opts.dependencies || [];
          facet._compute = opts.computeMethod;

          if (facet._compute === undefined || typeof facet._compute !== 'function') {
            console.log(`Impossible to create facet without a compute method. id:${id}`);
            return;
          }

          if (typeof facet.dependencies !== 'array') {
            console.log(`Impossible to create facet because dependencies are not an array. id:${id}`);
            return;
          }

          if (opts.data !== undefined) {
            facet.data = opts.data;
            facet.ready = true;
          }
          
          facet.isReady = () => facet.ready;
          facet.isLoadable = () => !!facet.loadable;
          // Alias for commodity
          facet.isCached = facet.isLoadable;
          facet.getDependencies = () => facet.dependencies;

          facet.getData = function () {
            if (facet.isReady()) {
              return facet.data;
            } else {
              console.log(`Impossible to get data because this facet is not ready: ${facet.id}`);
            }
          }

          // Like getData but in an asynchronous fashion
          facet.callData = function (callback) {
            if (facet.isReady()) {
              callback(facet.data);
            } else {
              console.log(`Impossible to call data because this facet is not ready: ${facet.id}`);
            }
          }

          facet.load = function (callback) {
            if (facet.isLoadable()) {
              if (!facet.needsSerialization) {
                let url = ns.getFacetCacheURL(facet.id);
                $.get(url, function(d){
                  facet.data = d;
                  facet.ready = true;
                  callback(facet.data);
                }).fail(function() {
                    console.log(`Facet loading failed for unknown reasons.\nid:${id}\nurl:${url}`);
                  })
              } else {
                // TODO: implement serialization
                console.log(`Serialization not implemented.`);
              }
            } else {
              console.log(`Unloadable facet: ${id}`);
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

          facet.compute = function (callback) {
            if (facet.areDependenciesReady()) {
              facet.data = facet.compute();
              facet.ready = true;
              callback(facet.data);
            } else {
              console.log(`Facet not computed because dependencies are not ready. id: ${id}`);
            }
          }

          ns.facetDictionary[facet.id] = facet;
          return facet;
        } else {
          console.log(`Facet not created because its id already exists: ${id}`);
        }
      } else {
        console.log('Facet not created because it has no id');
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
        console.log(`Cannot retrieve cache URL from id ${id}`);
      }
    }

    return ns;
  })
