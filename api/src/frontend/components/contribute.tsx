import * as React from 'react';
import { TextField } from "@rmwc/textfield";
import '@rmwc/textfield/styles';
import '@rmwc/dialog/styles';
import '@rmwc/button/styles';
import * as polkadot from "../utils/polkadot";
import { BasicTxResponse, Currency, User } from "../models";
import { web3FromSource } from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { DispatchError } from '@polkadot/types/interfaces';
import { AccountChoice } from './accountChoice';
import { ErrorDialog } from './error-dialog';
import type { ITuple, } from "@polkadot/types/types";
import ChainService from '../services/chain-service';

export type ContributeProps = {
    imbueApi: polkadot.ImbueApiInfo,
    user: User,
    projectOnChain: any,
    chainService: ChainService
}

enum ButtonState {
    Default,
    Saving,
    Done
}

type ContributeState = {
    showPolkadotAccounts: boolean,
    showErrorDialog: boolean,
    errorMessage: String | null,
    contribution: number,
    buttonState: ButtonState
}

export class Contribute extends React.Component<ContributeProps> {
    state: ContributeState = {
        showPolkadotAccounts: false,
        showErrorDialog: false,
        errorMessage: null,
        contribution: 0,
        buttonState: ButtonState.Default
    }

    async contribute(account: InjectedAccountWithMeta): Promise<void> {
        await this.setState({ showPolkadotAccounts: false, buttonState: ButtonState.Saving });
        const result: BasicTxResponse = await this.props.chainService.contribute(account,
            this.props.projectOnChain,
            BigInt(this.state.contribution * 1e12));

        // TODO timeout the while loop
        while (true) {
            if (result.status || result.txError) {
                if (result.status) {
                    await this.setState({ buttonState: ButtonState.Done });
                } else if (result.txError) {
                    await this.setState({ buttonState: ButtonState.Default, showErrorDialog: true, errorMessage: result.errorMessage });
                }
                break;
            }
            await new Promise(f => setTimeout(f, 1000));
        }
    }

    updateContributionValue(newContribution: number) {
        this.setState({ contribution: newContribution });
    }

    async beginContribution(): Promise<void> {
        this.setState({ showPolkadotAccounts: true, buttonState: ButtonState.Done });
    }

    handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        this.setState({ showPolkadotAccounts: true });
    }

    closeErrorDialog = () => {
        this.setState({ showErrorDialog: false});
    }

    render() {
        return (
            <div>

                <ErrorDialog errorMessage= {this.state.errorMessage} showDialog={ this.state.showErrorDialog } closeDialog={this.closeErrorDialog}></ErrorDialog>

                {this.state.showPolkadotAccounts ?
                    <h3 id="project-state-headline">
                        <AccountChoice accountSelected={(account) => this.contribute(account)} />
                    </h3>
                    : null
                }
                <form id="contribution-submission-form" name="contribution-submission-form" method="get" className="form" onSubmit={this.handleSubmit}>
                    <TextField
                        type="number"
                        step="any"
                        onChange={(event: React.FormEvent) => this.updateContributionValue(parseFloat((event.target as HTMLInputElement).value))}
                        outlined className="mdc-text-field" prefix={`$${this.props.projectOnChain.currencyId as Currency}`}
                        label="Contribution Amount..." required />
                    <button
                        type="submit"
                        disabled={this.state.buttonState == ButtonState.Saving}
                        className={this.state.buttonState == ButtonState.Saving ? "button primary blob" : this.state.buttonState == ButtonState.Done ? "button primary finalized" : "button primary"}
                        id="contribute-button">
                        {
                            this.state.buttonState == ButtonState.Saving ? "Saving....."
                                : this.state.buttonState == ButtonState.Done ? "Contribution Succeeded"
                                    : "Contribute"}
                    </button>
                </form>
            </div>
        );
    }
}