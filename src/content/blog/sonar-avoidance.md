---
title: 'Sonar Avoidance - Creating my agents avoidance algorithm'
description: 'Sample article demonstrating the blog layout, cards, and meta.'
pubDate: 'Aug 12 2025'
heroImage: '../../assets/images/example-blog-hero1.jpg'
category: 'Showcase'
tags: ['ai', 'navigation']
---

# Sonar Avoidance

Sonar avoidance is state of the art agents local avoidance algorithm that I created for my RTS game. It is heavily inspired by Starcraft 2 and by GDC 2011 talk [AI Navigation: It's Not a Solved Problem - Yet](https://www.gdcvault.com/play/1014514/AI-Navigation-It-s-Not). As the talk did not really went into any algorithmic details and only presenting surface level concept, I consider this algorithm fully my own. However I would not be suprised that somebody else also created something similar at some point under different name. In this blog I will cover the history how I come up this algorithm and will explain in details how it functions.

For those who interested the sonar avoidance is implementation. It is available in Unity Engine and can be bought in asset store as standalone algorithm [Local Avoidance](https://assetstore.unity.com/packages/tools/behavior-ai/local-avoidance-214347) and full integration with unity navmesh in [Agents Navigation](https://assetstore.unity.com/packages/tools/behavior-ai/agents-navigation-239233).
Since 2022 these packages where downloaded ~23k times and succesfully released in many games. Maybe numbers dont sounds that staggering big, but dont forget these are not end users that downloaded, but developers that use to create their games. For this reason I consider it big success and main reason of writing this blog article sharing a bit insights about sonar avoidance algorithm.

## History Of Algorithm

In this section I am going to cover a bit the motivation and how I come with the algorithm. If you more interested in technical details, I recommend skipping this section as you probably wont find it interested.

### Warcraft

In 2014 I started working in Unity this is where I discovered the Unity Engine as tool for creating the games. I quickly fell in love with the tool and decided that I want to create the game with it. This then I started developing my wacraft 3 mobile knock-off.
<div style="max-width:500px;">
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
    <iframe
      src="https://www.youtube.com/embed/knjl9LzwPfU"
      title="Warcraft On Mobile"
      style="position:absolute;top:0;left:0;width:100%;height:100%;"
      frameborder="0"
      allowfullscreen>
    </iframe>
  </div>
</div>

In high-sight it was not the greatest choice to straight up copy game even, if it was idea to put it into mobile. As it would not get past neither the android store or apple store, but I had this naive hope that maybe Blizzard would get interested in project. Well that of course never happened, but believe me I tried...

There was actually the reason why I chose this project. Back in my teens I was insanly invested in Warcraft 3 modding. The warcraft 3 had this tool called warcraft 3 map editor it allowed creation of what they called `Map`, which can later on be hosted in multiplayer and played by other users. Map editor was very powerful and I think to this day is probably the greatest blizzard creation, but that is a topic for another time...

### Navigation Solution
Probably one of the most important feature in RTS game is having good agent navigation solution. If it does not work that well people will get very frustrated and probably will stop playing your game. So its very important to make that part right. Probably to this day starcaft 2 navigation is considered one of the best navigation solution in rts game. It was done so well that many starcraft pros hated it as it made agent navigate to easily reducing the agent macroing element as the skill which was quite relevent in starcraft 1.

### Unity Navigation
As I was creating my game with unity engine I firstly tried their builtin solution. It was combination of two solution for global navigation using navigation mesh and for local avoidance [ORCA](https://gamma.cs.unc.edu/ORCA/).

[Navigation Mesh or navmesh](https://en.wikipedia.org/wiki/Navigation_mesh) is simply put triangulated mesh of your game world, where none of the mesh edges intersect your game obstacles. Building navmesh is quite expensive, but it has way fewer nodes compared to grid based solutions. For path finding path it simply runs [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm) using the start and end node.

However as navmesh is quite expensive to rebuild it is only used for static obstacles like buildings, but agents that constantly stopping and moving is not used. This is where it comes the local avoidance solution called [ORCA](https://gamma.cs.unc.edu/ORCA/). This algorithm is extended version of RVO that designed to more accurate avoidance then there are multiple agents. In many games this algorithm is perfect, it produces really nice avoidance in bigger groups, somewhat very similar to crowds. However in indivual agent motion algorithm starts to show some cracks.

One of the main undesired behaviour I noticed quite immediately was in typical RTS scenarios where you have groups of agents trying to surround the target. With orca agents would start to just clump on one side of the agent instead of trying to surround it. Where in games likes warcraft 3 where each agent is very essential that would not be acceptable as many agants would simply stand instead of attacking.
TODO video

The next issue with ORCA I noticed that algorithm quite heavily relied on varrying velocities of agents. Which makese a lot of sense in crowd simulations and there is lots of nice papers going in details how density based velocities performs increadibly well in high congestion scenarios. However in game cases where high congestion scenarios less frequent and you have huge groups just moving to some objective it very quikcly becomes a drawback. As your agants no longer maximize they speed. As for example, if you moving just one agent around another agents either them moving or not, you dont want it to slow down in sake of other agents as you prioritize it.
TODO video

The last thing I found very inconvient with orca that it really struggled to escape cases where agents would form concave walls. So agent moving into these scenarios would straight up end up stuck.
TODO video

After seeing this issue I realised that navmesh+orca was not going to cut for me as navigation solution for my game. I started reaserching the alternatives. At least back then around 2016 it was really hard to find any information about the other succesful rts game navigation solutions, information was very sparse and kept at minimum. My guess was that a lot of success around rts games was how well their agents able to navigate and componies treated them as secret to avoid competition. But that is just my guess, yours good as mine.

#### Warcraft 3 Navigation
Obvious first research point was the warcraft navigation as I was recreating the warcraft that was kinda non brainer. What I found from my investigation that warcraft was using grid based solution for both global navigation and local avoidance.

For those who dont know the grid based navigation. It is essentially splitting your game world into 2d node graph where each node is fixed size quad. Where node indicates, if it is traversable or not. Usually if there is some obstacle it will indicate that node as non traversable. Then each agent knowing its start and destination node simply run [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm) to quikcly find shortest node subset that will need to traverse in order to reach destination without stepping on blocked nodes.

In warcraft 3 you rarely have more than 20-30 agents this is usually capped by food resource in the game. However for those who used map editor and tried maps with this limitation removed, you quickly notice how poorly this navigation solution performance in groups of 100 and more. Agents start to stop, block each other, jitter and it lots of comes that local avoidance being combined with global navigation in discrete space. It simply lacks fluid motion that you can see in starcraft 2. Even though I was recreating warcraft 3 in agents I wanted to make it better, so for this reason I decided not to go with same solution as my predecessor.

#### Supreme Commander 2 Navigation
In my eyes starcraft 2 was on the top of being pathfinding department. However there was one more game that equally amazed me even more was Supreme Commander 2.
The navigation of crowds in that game was on another level. Where two huge groups would traverse each other almost like fluid.
TODO supreme command 2

After investigation I found they where using modified solution of [Continuum Crowds](https://grail.cs.washington.edu/projects/crowd-flows/continuum-crowds.pdf). It is another grid based graph node solution, but uses [flow fields](https://en.wikipedia.org/wiki/Flow_(mathematics)). Traditionally you would have agent individually calculating its path from start to end node, where with flow field each node acts as start node and its velocity guides to shared end node(s). You can imagine flow field as ocean and the end goal as vortex, regardless where you put ure agent in ocean it will get guided towards the vortex. So continuum crowds is esentially flow field solution, but it takes into account information like density of agents in place, how fast agents are moving in place, thus archieving very fluid motion.

The glaring issue with flow fields in general as path calculation happens on shared goal accross whole graph. Which makes it extremely afficient in huge groups that share same goal, but very inefficient in cases where there is a lot of agents with invididual goals or even with maps that are very huge. Of course there are modifications that one way or another way leviate the cost in these scenarios, but does solve them completely. So the game has to be designed around this limitations as that can be seen in supreme commander 2 that mostly groups are controlled and there are not worker agents. Where in warcraft 3 you have a lot of agents moving individually like workers, hero, neutral monsters and so on.

#### Starcraft 2 Navigation
Eventually I come back to game that in my opinion had one of the most amazing agent navigation solutions. Finding information about starcraft 2 navigation was quite a challanage as seems like blizzard was keeping it quite hidden. After experimenting with their editor and in game, I found quite quikcly that their where using the navmesh for global navigation and for local avoidnace they had their own propertery solution. The only source of information I managed to stumble was GDC 2011 talk [AI Navigation: It's Not a Solved Problem - Yet](https://www.gdcvault.com/play/1014514/AI-Navigation-It-s-Not). In that gdc talk blizzard very briefly covered their navigation solution more from terms of challange they had to face it, but did not really dwell into technical details. They also confirmed using navmesh as I guessed and quite nicely explained how they did rebuilding. As for navmesh it seems like they used way simplier solution compared what unity had as unity allowed baking navmesh pretty much in 3d space, where starcraft 2 solution was mainly tied to 2.5d world. For the avoidance main hint that they gave away that they had almost like vision based solution where agent would try to look some distance in front of him and look for openings to avoid collision and slip in.

## Algorithm

The idea of sonar avoidance is simple at its core. Imagine each agent has a field of view similar to humans, roughly 200–220° horizontally and 130–135° vertically.

As in most games, we do not need full 3D perception. We ignore the vertical field of view and consider only the horizontal plane. This reduces the problem from a 2D angular space (horizontal + vertical) to a 1D angular domain.

We represent the horizontal field of view as an angular interval centered at the agent’s forward direction:

$$
\theta \in [\theta_{\min}, \theta_{\max}]
$$

We treat this interval as a 1D range where $\theta_{\min}$ is the left boundary, $\theta_{\max}$ is the right boundary, and $0^\circ$ is the desired forward direction.

---

### Splitting the Field of View

For convenience, we split the interval into two subranges:

$$
V = \left\{ [\theta_{\min}, 0], \; [0, \theta_{\max}] \right\}
$$

This separates the field of view into negative (left) and positive (right) angles relative to the forward direction.

---

### Obstacle Projection into Sonar Space

Each obstacle blocks part of the agent’s field of view. The closer and larger the obstacle, the larger the angular interval it blocks. Obstacles outside the vision radius are ignored.

We define a function that transforms a static obstacle from world space into angular (sonar) space:

$$
f_{\text{static}}(\mathbf{p}_i, r_i) \rightarrow I_i
$$

The vector $\mathbf{p}_i \in \mathbb{R}^2$ is the obstacle position, $r_i$ is its radius, and $I_i \subset [\theta_{\min}, \theta_{\max}]$ is the blocked angular interval.

First, we convert the obstacle position into agent local space:

$$
\tilde{\mathbf{p}}_i = R(\mathbf{p}_i - \mathbf{p}_a), 
\qquad 
\tilde{r}_i = r_i + r_a
$$

The vector $\mathbf{p}_a \in \mathbb{R}^2$ is the agent position, $r_a$ is the agent radius, and $R$ is the rotation aligning the desired direction with $0^\circ$.

The obstacle angle and half-blocking angle are:

$$
\theta_i = \operatorname{atan2}(\tilde{p}_{i,y}, \tilde{p}_{i,x}),
\qquad
\varphi_i = \arcsin\left( \frac{\tilde{r}_i}{\|\tilde{\mathbf{p}}_i\|} \right)
$$

The resulting blocked interval is:

$$
f_{\text{static}}(\mathbf{p}_i, r_i) 
=
[\theta_i - \varphi_i, \; \theta_i + \varphi_i]
$$

---

### Cutting Visible Ranges

For each blocked interval $I_i$, we subtract it from the current set of visible ranges.

Each subtraction may remove a range entirely, shrink a range, or split a range into two smaller ranges.

After processing all obstacles, we obtain a set of valid angular intervals:

$$
R = \{ I_0, I_1, \dots, I_n \}
$$

Each interval $I_k = [\alpha_k, \beta_k]$ represents a collision-free angular range.

---

### Selecting the Best Direction

Each interval in $R$ represents a set of safe directions.

The agent typically has a desired direction $\theta_d$ coming from global path planning.  
Since all obstacles are converted to local space, we assume:

$$
\theta_d = 0
$$

We select the interval in $R$ closest to $\theta_d$.

The optimal steering angle is $0$ if it lies inside some interval. Otherwise, it is the boundary value minimizing $|\theta - \theta_d|$.

If $R = \emptyset$, the agent is fully blocked and must apply a fallback strategy such as slowing down, rotating in place, or using a higher-level decision.

---

## Persistent State

The static formulation works well for static obstacles. However, without persistent state, the agent may oscillate between directions.

To mitigate this, we incorporate the current velocity direction $\theta_v$.

We define a cost function:

$$
C(\theta) 
=
(1 - w)\, d(\theta, \theta_d) 
+
w\, d(\theta, \theta_v)
$$

The function $d(\theta_1, \theta_2)$ denotes the minimal angular distance, and $w \in [0,1]$ controls how strongly the current velocity influences the decision.

For each interval $I_k$, we evaluate boundary angles $\theta \in \{\alpha_k, \beta_k\}$ and select the one minimizing $C(\theta)$. This biases the solution toward directions consistent with the current motion and reduces oscillations.

---

## Dynamic Obstacles

Applying the static solution to dynamic agents often produces V-shaped formations. Each agent predicts a collision even if all agents move at identical velocities and would never intersect.

To handle dynamic obstacles, we account for relative velocity.

We define:

$$
f_{\text{dynamic}}(\mathbf{p}_i, \mathbf{v}_i, r_i) \rightarrow I_i
$$

The vector $\mathbf{p}_i \in \mathbb{R}^2$ is the obstacle position, $\mathbf{v}_i \in \mathbb{R}^2$ is its velocity, and $r_i$ is its radius.

A collision occurs if there exists $t > 0$ such that:

$$
\left|
(\mathbf{p}_i + \mathbf{v}_i t)
-
(\mathbf{p}_a + \mathbf{v}_a(\theta_g) t)
\right|
=
r_i + r_a
$$

The vector $\mathbf{p}_a$ is the agent position, $r_a$ is the agent radius, and $\mathbf{v}_a(\theta_g)$ is the agent velocity parameterized by steering angle $\theta_g$ with constant speed $s_a$:

$$
\mathbf{v}_a(\theta_g)
=
s_a
\begin{bmatrix}
\cos \theta_g \\
\sin \theta_g
\end{bmatrix}
$$

We convert everything into agent local space:

$$
\tilde{\mathbf{p}}_i = R(\mathbf{p}_i - \mathbf{p}_a),
\qquad
\tilde{\mathbf{v}}_i = R(\mathbf{v}_i),
\qquad
\tilde{r}_i = r_i + r_a
$$

The relative-motion condition becomes:

$$
\left|
\tilde{\mathbf{p}}_i
+
(\tilde{\mathbf{v}}_i - \mathbf{v}_a(\theta_g)) t
\right|
=
\tilde{r}_i
$$

Solving this system for $t$ and $\theta_g$ determines whether a future collision occurs and which angular interval must be blocked.

Agents moving in parallel at identical velocity will have zero relative velocity and therefore generate no blocking interval, preventing unnecessary avoidance.

Solving this function is the most computationally expensive part of the sonar avoidance algorithm.


---

## Navmesh Integration

Integrating sonar avoidance with a navmesh is straightforward.  
The agent collects all nearby navmesh edges and constructs static line obstacles from them.

We define:

$$
f_{\text{wall}}(\mathbf{p}_{i,s}, \mathbf{p}_{i,e}) \rightarrow I_i
$$

The vectors $\mathbf{p}_{i,s} \in \mathbb{R}^2$ and $\mathbf{p}_{i,e} \in \mathbb{R}^2$ denote the start and end positions of the $i$-th navmesh edge.  
The interval $I_i \subset [\theta_{\min}, \theta_{\max}]$ represents the blocked angular range generated by that edge.

As with static circular obstacles, the edge endpoints are transformed into agent local space.  
The resulting angular interval is then subtracted from the visible range set $R$.

---

## Smart Stop

The algorithm typically terminates when the agent is sufficiently close to its destination.  
However, like most local avoidance algorithms, sonar avoidance does not guarantee convergence in all scenarios.

Therefore, a higher-level mechanism is required to detect pathological cases and terminate early.

Two simple strategies are sufficient to handle most remaining scenarios.  
We call them **Hive Mind Stop** and **Give Up Stop**.

---

### Hive Mind Stop

Hive Mind Stop solves termination in group movement.

When multiple agents move toward the same destination, typically only one reaches it, while others may oscillate around it indefinitely.

To address this, each agent that is within a small threshold distance from the destination inspects nearby dynamic obstacles.  
If neighboring agents are already stopped, have a similar destination, and are within proximity, the agent also stops.

This produces stable group termination behavior.

---

### Give Up Stop

Give Up Stop handles situations where an agent becomes stuck in complex concave obstacle formations.

Each agent maintains a progress variable:

$$
t_{\text{giveup}} \in [0, t_{\text{giveup,max}}]
$$

The variable is initialized as:

$$
t_{\text{giveup}} = 0
$$

At each update step, the agent scans nearby dynamic obstacles.

If blocking conditions persist, the timer increases:

$$
t_{\text{giveup}} \leftarrow \min\left(t_{\text{giveup,max}}, \, t_{\text{giveup}} + \Delta t \right)
$$

Otherwise, it decreases:

$$
t_{\text{giveup}} \leftarrow \max\left(0, \, t_{\text{giveup}} - \Delta t \right)
$$

If

$$
t_{\text{giveup}} = t_{\text{giveup,max}}
$$

the agent terminates movement.

This mechanism allows temporary congestion while preventing infinite oscillation in deadlock configurations.

---

## Optimization

Sonar avoidance is computationally expensive, and the cost increases with the number of obstacles.

Limiting evaluation to the $n$ closest obstacles provides stable computational cost with a manageable reduction in avoidance quality.
