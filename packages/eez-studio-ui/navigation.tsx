import React from "react";
import { observer } from "mobx-react";
import classNames from "classnames";

import { Icon } from "eez-studio-ui/icon";

export interface INavigationItem {
    id: string;
    icon: string;
    title: string;
    position?: string;
    attention?: boolean;
}

@observer
export class NavigationItem extends React.Component<
    {
        item: INavigationItem;
        selected: boolean;
        selectItem: (item: INavigationItem) => void;
    },
    {}
> {
    constructor(props: any) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        this.props.selectItem(this.props.item);
    }

    render() {
        let className = classNames("EezStudio_NavigationItem", {
            EezStudio_Selected: this.props.selected
        });

        return (
            <li className={className}>
                <a href="#" title={this.props.item.title} onClick={this.handleClick}>
                    <Icon icon={this.props.item.icon!} />
                    {this.props.item.attention && (
                        <div className="EezStudio_NavigationItemNeedsAttention" />
                    )}
                </a>
            </li>
        );
    }
}

@observer
export class Navigation extends React.Component<
    {
        items: INavigationItem[];
        selectedItem: INavigationItem;
        selectItem: (item: INavigationItem) => void;
    },
    {}
> {
    render() {
        return (
            <div className="EezStudio_Navigation">
                <ul className="list-unstyled">
                    {this.props.items
                        .filter(item => !item.position || item.position === "top")
                        .map(item => (
                            <NavigationItem
                                key={item.id}
                                item={item}
                                selected={item === this.props.selectedItem}
                                selectItem={this.props.selectItem}
                            />
                        ))}
                </ul>
                <ul className="list-unstyled">
                    {this.props.items.filter(item => item.position === "bottom").map(item => (
                        <NavigationItem
                            key={item.id}
                            item={item}
                            selected={item === this.props.selectedItem}
                            selectItem={this.props.selectItem}
                        />
                    ))}
                </ul>
            </div>
        );
    }
}
