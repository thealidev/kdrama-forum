import React from 'react';
import * as I from "../data";
import { KeyedItem, Layout, Tab, Tabs } from './PageLayout';
import * as Summaries from "./Components";
import { getUserPageUrl, UserPageType } from "../io/pageId";
import './Pages.css';
import { ReactComponent as LocationIcon } from "./icons/material/ic_location_on_24px.svg";


/*
  While `App.tsx` defines "container" components, which manage routes and state,
  conversely this `Page.tsx` defines "presentational" components.
*/

/*
  SiteMap
*/

export function SiteMap(data: I.SiteMap): Layout {
  const contents: KeyedItem[] = [];

  /*
    visitors can see:
    - image document[s]
    - (featured) articles
    - (text) sources

    and cannot see:
    - users
    - discussions
    - feaure reports
    - notable omissions
  */

  // render the images
  data.images.forEach(x => contents.push(Summaries.getImageSummary(x)));

  const features = (
    <React.Fragment>
      <h2>Features</h2>
      <div className="features">
        {data.features.map(feature => {
          const content = Summaries.getFeatureSummary(feature);
          /*
            either we need to add whitespace between elements ...
            - https://github.com/facebook/react/issues/1643
            - https://reactjs.org/blog/2014/02/20/react-v0.9.html#jsx-whitespace
            ... or to add whitespace between spans ...
            - https://github.com/facebook/react/issues/1643#issuecomment-321439506
          */
          return (
            <span key={content.key}>
              {content.element}
            </span>
          );
        })}
      </div>
    </React.Fragment>
  );

  contents.push({ element: features, key: "Feature" });

  return { main: contents };
}

/*
  Image
*/

function getLayerKey(layer: I.LayerNode): string {
  return (layer.alias)
    ? layer.alias
    : layer.name.toLowerCase().replace("&", "and").replace(" ", "-");
}

function handleLayerChange(event: React.ChangeEvent<HTMLInputElement>) {
  const target = event.target;
  const alias: string | null = target.getAttribute("name");
  const checked: boolean = target.checked;
  alert(`In the non-prototype this would ${(checked) ? "show" : "hide"} the '${alias}' image layer`);
}

function renderNode(node: I.LayerNode, alias: string): React.ReactElement {
  // https://stackoverflow.com/questions/26615779/react-checkbox-not-sending-onchange
  return <label><input type="checkbox" defaultChecked={true} onChange={handleLayerChange} name={alias} />{node.name}</label>
}

function renderLayers(layers: I.ImageLayers, level: number): React.ReactElement {
  const className = (level === 0) ? "image-layers" : undefined;
  const listItems = layers.map((node) => {
    const alias = getLayerKey(node);
    return (
      <li key={alias} className={node.children ? "parent" : undefined}>
        {renderNode(node, alias)}
        {node.children && renderLayers(node.children, level + 1)}
      </li>
    );
  });
  return (
    <ul className={className}>
      {listItems}
    </ul>
  )
}

export function Image(data: I.Image): Layout {
  const images =
    <div className="image-images">
      <img src={data.image.src} height={data.image.height} width={data.image.width} alt="" />
    </div>;
  const layers = renderLayers(data.layers, 0);
  return {
    main: images,
    width: "Full",
    right: { element: layers, width: data.layersWidth, showButtonLabel: "Show Layers", visible: true }
  };
}

/*
  Users
*/

export function Users(data: I.UserSummaryEx[]): Layout {
  const users: React.ReactElement =
    <div className="all-users">
      {data.map(user => {
        const { userName, gravatar, key } = Summaries.getUserSummary(user, { title: false, size: "big" });
        return (
          <div className="user-info" key={key}>
            {gravatar}
            <div className="details">
              {userName}
              {user.location ? <span className="user-location">{user.location}</span> : undefined}
            </div>
          </div>
        );
      })}
    </div>;
  return {
    main: users,
    width: "Grid"
  };
}

/*
  User
*/

export function User(data: I.User, userPageType: UserPageType, canEdit: boolean): Layout {
  const { userName, gravatar } = Summaries.getUserSummary(data.summary, { title: false, size: "huge" });
  const gravatarSmall = Summaries.getUserSummary(data.summary, { title: false, size: "small" }).gravatar;
  const selected = canEdit
    ? ((userPageType === "Profile") ? 0 : (userPageType === "EditSettings") ? 1 : 2)
    : ((userPageType === "Profile") ? 0 : 1);
  const idName: I.IdName = data.summary.idName;

  const profile: Tab = {
    navlink: { href: getUserPageUrl(idName, "Profile"), text: "Profile" },
    content: (
      <div className="user-profile profile">
        {gravatar}
        <div className="column">
          <h1>{data.summary.idName.name}</h1>
          {data.summary.location ? <p className="location"><LocationIcon viewBox="0 0 24 24" width="18" height="18" /> {data.summary.location}</p> : undefined}
          <div className="about">
            <p>About me</p>
          </div>
        </div>
      </div>
    )
  };

  function getSettings(): Tab {
    const inputDisplayName = React.createRef<HTMLInputElement>();
    const inputEmail = React.createRef<HTMLInputElement>();
    const inputLocation = React.createRef<HTMLInputElement>();
    const inputAbout = React.createRef<HTMLInputElement>();
    const preferences: I.UserPreferences = data.preferences!;

    const rc: Tab = {
      navlink: { href: getUserPageUrl(idName, "EditSettings"), text: "Edit" },
      content: (
        <div className="user-profile settings">
          <h1>Edit</h1>
          <h2>Public information</h2>
          <div className="public">
            {gravatar}
            <div className="column">
              <label>Display name</label>
              <input type="text" ref={inputDisplayName} placeholder="required" defaultValue={data.summary.idName.name} />
              <label>Location (optional)</label>
              <input type="text" ref={inputLocation} placeholder="optional" defaultValue={data.summary.location} />
            </div>
          </div>
          <label>About me</label>
          <input type="text" ref={inputAbout} placeholder="required" defaultValue={data.profile.aboutMe} />
          <h2>Private settings</h2>
          <label>Email</label>
          <input type="text" ref={inputEmail} placeholder="required" defaultValue={preferences.email} />
        </div>
      )
    };
    return rc;
  }
  const settings: Tab | undefined = canEdit ? getSettings() : undefined;

  const activity: Tab = {
    navlink: { href: getUserPageUrl(idName, "Activity"), text: "Activity" },
    content: <p>Where</p>
  };
  const header = {
    first: (
      <React.Fragment>
        {gravatar}
        <h1>{userName}</h1>
      </React.Fragment>
    ),
    next: (
      <React.Fragment>
        <h1>{userName}</h1>
        {gravatarSmall}
      </React.Fragment>
    )
  };
  const tabs: Tabs = {
    style: "Profile",
    header,
    selected,
    tabbed: canEdit ? [profile, settings!, activity] : [profile, activity]
  };
  return {
    main: tabs
  };
}