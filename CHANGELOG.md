# Changelog

## 1.8.2 (2025-10-31)

- windows nsi - clean target /app directory before installing
- protect - harden script call replace

## 1.8.1 (2024-09-27)

- OSX final name  now contains 'arch'

## 1.8.0 (2024-05-28)

- (Installer) If no `app_name` given, use the `name` in `package.json` of the deployed app

## 1.7.1 (2024-05-15)

- (internal) refactor decompress. now needs `unzip` package
- (doc) wine 9.0 needed for nwjc for nwjs >= 0.69 

## 1.7.0 (2024-04-25)

- nsi : check opened window
- use node 21.1.0

## 1.6.1 (2024-02-06)

- nsi : correct template (uninstall)
- update dependencies

## 1.6.0 (2023-11-10)

- use node 18.18.2
- update dependencies
- msi : `wixl_relative_path` new parameter
