(function(root, factory) {
  // based on https://github.com/umdjs/umd
  if(typeof define === 'function' && define.amd) {
    define(['paper'], function(paper) {
      return (root.mtrackr = factory(paper))
    })
  } else if(typeof module === 'object' && module.exports) {
    module.exports = factory(require('paper/dist/paper-core.js'))
  } else {
    root.mtrackr = factory(root.paper)
  }
}(this, function(paper) {
  
// mtrackr begin

paper.setup()

var mtrackr = {}

var newWalkState = function() {
  return {
    walking: false,
    offset: 0
  }
}
var walkState = newWalkState()
var resetWalkState = function() {
  clearTimeout(walkState.timeout)
  walkState = newWalkState()
}
var hideMtrackr = function() {
  $('.mtrackr-virtual-mouse-pointer').hide()
  $('body *').mouseleave()
}
var resetMtrackr = function() {
  sessionStorage.removeItem('mtrackr')
  resetWalkState()
  hideMtrackr()
}
$(window).resize(function() {
  resetMtrackr()
})

var shiftStep = function(steps) {
  var step = steps.shift()
  var successor = steps[0]
  if(successor) {
    if(!successor.from) {
      successor.from = step.to
    }
  }
  sessionStorage.setItem('mtrackr', JSON.stringify({
    steps: steps
  }))
  return step
}

var nextWalk = function() {
  if(sessionStorage.mtrackr) {
    var steps = JSON.parse(sessionStorage.mtrackr).steps
    if(steps) {
      var step = shiftStep(steps)
      if(step) {
        singleWalkClick(step.from, step.to)
      }
    }
  }
}

var goToNextPoint = function(stepDelay) {
  walkState.walking = true
  var p = walkState.path.getPointAt(walkState.offset)
  if(p) {
    $('.mtrackr-virtual-mouse-pointer').offset({ left: p.x, top: p.y })
  }
  var go = function() {
    var p = walkState.path.getPointAt(walkState.offset)
    if(p) {
      $('.mtrackr-virtual-mouse-pointer').offset({ left: p.x, top: p.y })
      var scrollTop = $(window).scrollTop()
      if((p.y - 100) < scrollTop) {
        window.scrollTo(p.x, p.y - 100)
      } else {
        var windowHeight = $(window).height()
        if((p.y + 200) > (scrollTop + windowHeight)) {
          window.scrollTo(p.x, p.y + 200 - windowHeight)
        }
      }
      walkState.offset += 3
      walkState.timeout = setTimeout(goToNextPoint, 1)
    } else {
      if(walkState.interaction) {
        walkState.timeout = setTimeout(function() {
          switch(walkState.interaction) {
          case 'show':
            walkState = newWalkState()
            walkState.walking = true
            walkState.timeout = setTimeout(nextWalk, 1000)
            break
          case 'hover':
            $(walkState.element).mouseenter()
            walkState = newWalkState()
            walkState.walking = true
            walkState.timeout = setTimeout(nextWalk, 2000)
            break
          default:
            walkState.click(function(proceedOnSamePage) {
              if(proceedOnSamePage) {
                walkState.walking = true
                walkState.timeout = setTimeout(nextWalk, 1000)
              }
            })
            walkState = newWalkState()
            break
          }
        }, 1000)
      } else {
        walkState.timeout = setTimeout(function() {
          hideMtrackr()
          walkState = newWalkState()
        }, 2000)
      }
    }
  }
  if(stepDelay) {
    // wait stepDelay
    walkState.timeout = setTimeout(go, stepDelay)
  } else {
    go()
  }
}
//goToNextPoint()

var getCenter = function(element) {
  var offset = element.offset()
  var width = element.width()
  var height = element.height()
  var x = offset.left + width / 2
  var y = offset.top + height / 2
  return { x:x, y:y }
}

var singleWalkClick = function(from, to) {
  if(walkState.walking) {
    resetWalkState()
  } else {
    hideMtrackr()
  }
  // from
  var start = {}
  if(from.element) {
    var fromElement = $(from.element)
    if(!fromElement.length) {
      resetMtrackr()
      return
    }
    start = getCenter(fromElement)
  } else {
    start = from
  }
  // to
  $('.mtrackr-virtual-mouse-pointer').show()
  var targetElement = $(to.element)
  if(!targetElement) {
    resetMtrackr()
    return
  }
  switch(to.interaction) {
  case 'justshow':
  case 'showend':
    break
  case 'show':
    walkState.interaction = 'show'
    break
  case 'hover':
    walkState.interaction = 'hover'
    walkState.element = targetElement
    break
  default: // (click)
    walkState.interaction = 'click'
    var href = targetElement.attr('href')
    if(href) {
      walkState.click = function(done) {
        location.href = href
        done(false)
      }
    } else {
      // no href found => click the element and hope this does something useful
      walkState.click = function(done) {
        targetElement.trigger('click')
        done(true)
      }
    }
    break
  }
  var target = getCenter(targetElement)
  var segments = []
  if(target.x < start.x) {
    segments = [
      new paper.Segment(new paper.Point(start.x, start.y), null, new paper.Point(-100, 0)),
      new paper.Point(target.x, target.y)
    ]
  } else {
    segments = [
      new paper.Segment(new paper.Point(start.x, start.y), null, new paper.Point( 100, 0)),
      new paper.Point(target.x, target.y)
    ]
  }
  var path = new paper.Path({
      segments: segments,
      closed: false
  })
  path.smooth()
  walkState.path = path
  goToNextPoint(to.stepDelay)
}

$(document).ready(function() {
  nextWalk()
})

mtrackr.buttonTemplate = '/bower_components/mtrackr/dist/views/mtrackr.html'
mtrackr.setup = function(options) {
  mtrackr.buttonTemplate = options.buttonTemplate
}
mtrackr.after = function(element, steps, options) {
  var options = options || {}
  var handlers = options.buttonHandlers || {
    '.mtrackr-showme-button': function(event) {
      mtrackr.run(steps, { x: event.pageX, y: event.pageY }, 'show', 'justshow', options.stepDelay)
    },
    '.mtrackr-clickforme-button': function(event) {
      mtrackr.run(steps, { x: event.pageX, y: event.pageY }, 'click', 'click', options.stepDelay)
    }
  }
  $(document).ready(function() {
    var span = $('<span></span>')
    $(element).after(span)
    span.load(options.buttonTemplate || mtrackr.buttonTemplate, null, function() {
      var keys = Object.keys(handlers)
      keys.forEach(function(key) {
        span.find(key).click(handlers[key])
      })
    })
  })
}
mtrackr.run = function(steps, start, interaction, lastInteraction, stepDelay) {
  var clonedSteps = JSON.parse(JSON.stringify(steps)).map(function(step) {
    if(!step.from) {
      if(!step.to) {
        return {
          to: step
        }
      }
    }
    return step
  })
  if(start) {
    clonedSteps[0].from = start
  }
  clonedSteps.forEach(function(step, index) {
    if(index < (clonedSteps.length - 1)) {
      step.to.interaction = step.to.interaction || interaction
    } else {
      // last step:
      step.to.interaction = step.to.interaction || lastInteraction
    }
    if(index > 0) {
      if(typeof step.to.stepDelay === 'undefined') {
        step.to.stepDelay = stepDelay
      }
    }
  })
  var step = shiftStep(clonedSteps)
  singleWalkClick(step.from, step.to)
}

// mtrackr end

return mtrackr
}))
