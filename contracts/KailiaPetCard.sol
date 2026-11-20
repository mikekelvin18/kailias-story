// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {ERC721WalletPass} from "@erc8426/contracts/src/ERC721WalletPass.sol";
import {BoundedAction} from "@erc8426/contracts/src/utils/BoundedAction.sol";

/// @title KailiaPetCard (wallet lab experiment, TEST NETWORKS ONLY)
/// @notice A kind ERC-8426 care-pet card. Each token is one child's care pet,
///  shown as an Apple Wallet / Google Wallet pass. Unlike the PetPass example
///  this pet NEVER dies, has no countdown, holds no value and has no prize
///  pot. A missed day is only "I missed you!" on the card.
///
///  The token is held by a random key the family's device makes for itself
///  (no email, no crypto wallet app, no seed phrase). The issuer pays all gas.
///
///  What is stored on chain is a pet, not a child: which companion (0-5), its
///  growth stage (0 egg .. 3 grown), happy days, hellos and the last visit
///  time. No name, age, score or anything about the child.
///
/// @dev Capability analysis (ERC-8426, "The capability configuration"):
///
///  Pass-reachable through a capability link, via the issuer operator:
///  - `sayHello`. It cannot transfer, burn or approve the token, moves no
///    value, and is bounded on chain to 3 per token per day. The worst a
///    forwarded link can do is say hello to the pet three times a day.
///
///  Signed path (the device key signs an issuer challenge; the issuer then
///  calls as operator or owner):
///  - `syncPet`: copies the app's pet growth to the card. Bounded to 12 per
///    token per day, moves no value.
///  - `release`: burns the card when the family deletes it. Owner-only on
///    chain, called by the issuer only after the holder's signed request.
contract KailiaPetCard is ERC721WalletPass, BoundedAction, Ownable {
    bytes32 public constant HELLO = keccak256("HELLO");
    bytes32 public constant SYNC = keccak256("SYNC");

    uint8 public constant COMPANION_COUNT = 6;
    uint8 public constant MAX_STAGE = 3;

    struct Pet {
        uint8 companion; // index into the app's companion list
        uint8 stage; // 0 egg, 1 baby, 2 little one, 3 grown up
        uint32 happyDays; // never decreases
        uint32 hellos; // "say hi" taps from the wallet card
        uint64 hatchedAt;
        uint64 lastVisit; // last time the app synced
    }

    mapping(uint256 tokenId => Pet) private _pets;
    uint256 private _nextTokenId;

    event PetSynced(uint256 indexed tokenId, uint8 stage, uint32 happyDays);
    event Hello(uint256 indexed tokenId);

    error UnknownCompanion(uint8 companion);
    error UnknownStage(uint8 stage);
    error HappyDaysGoBackwards(uint32 current, uint32 proposed);
    error NotTransferable(uint256 tokenId);

    constructor(string memory passBaseURI_, address initialOwner)
        ERC721("Kailia Pet Card (test)", "KPET")
        ERC721WalletPass(passBaseURI_)
        Ownable(initialOwner)
    {
        _configureAction(HELLO, 3, 1 days, 0, 0);
        _configureAction(SYNC, 12, 1 days, 0, 0);
    }

    // ── Issuer ──

    function mint(address to, uint8 companion) external onlyOwner returns (uint256 tokenId) {
        if (companion >= COMPANION_COUNT) revert UnknownCompanion(companion);
        tokenId = ++_nextTokenId;
        uint64 nowTs = uint64(block.timestamp);
        _pets[tokenId] = Pet(companion, 0, 0, 0, nowTs, nowTs);
        _mint(to, tokenId);
    }

    /// @notice Burn a card. The issuer calls this only after the holder's
    ///  signed `release` request (deleting the card or the family's data).
    function release(uint256 tokenId) external onlyOwner {
        _requireOwned(tokenId);
        delete _pets[tokenId];
        _burn(tokenId);
    }

    function setPassBaseURI(string calldata newBase) external onlyOwner {
        _setPassBaseURI(newBase);
    }

    function setActionOperator(address operator, bool allowed) external onlyOwner {
        _setActionOperator(operator, allowed);
    }

    // ── Pet actions (operator, bounded) ──

    function sayHello(uint256 tokenId) external onlyBoundedAction(HELLO, tokenId, 0) {
        unchecked {
            _pets[tokenId].hellos += 1;
        }
        emit Hello(tokenId);
        _passUpdate(tokenId);
    }

    function syncPet(uint256 tokenId, uint8 companion, uint8 stage, uint32 happyDays)
        external
        onlyBoundedAction(SYNC, tokenId, 0)
    {
        if (companion >= COMPANION_COUNT) revert UnknownCompanion(companion);
        if (stage > MAX_STAGE) revert UnknownStage(stage);
        Pet storage p = _pets[tokenId];
        if (happyDays < p.happyDays) revert HappyDaysGoBackwards(p.happyDays, happyDays);
        p.companion = companion;
        p.stage = stage;
        p.happyDays = happyDays;
        p.lastVisit = uint64(block.timestamp);
        emit PetSynced(tokenId, stage, happyDays);
        _passUpdate(tokenId);
    }

    // ── Views ──

    function pet(uint256 tokenId) external view returns (Pet memory) {
        _requireOwned(tokenId);
        return _pets[tokenId];
    }

    function _boundedActionOwner(uint256 tokenId) internal view override returns (address) {
        return _requireOwned(tokenId);
    }

    /// @dev Cards cannot be traded, sold or given away: only mint and burn
    ///  move a token. A child's pet is not a collectible.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert NotTransferable(tokenId);
        return super._update(to, tokenId, auth);
    }
}
